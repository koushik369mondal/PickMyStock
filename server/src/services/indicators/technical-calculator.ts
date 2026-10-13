import { NormalizedPriceCandle, NormalizedTechnicalIndicators } from '../market-data/types';

export interface IndicatorCalculationResult {
  indicators: NormalizedTechnicalIndicators;
  history: NormalizedTechnicalIndicators[];
  trend: 'bullish' | 'bearish' | 'neutral';
  volatility30d: number;
  relativeVolume: number;
}

export class TechnicalCalculator {
  /**
   * Calculate Simple Moving Average (SMA)
   */
  static calculateSMA(values: number[], period: number): (number | null)[] {
    const result: (number | null)[] = [];
    let sum = 0;

    for (let i = 0; i < values.length; i++) {
      sum += values[i];
      if (i >= period) {
        sum -= values[i - period];
      }

      if (i >= period - 1) {
        result.push(Number((sum / period).toFixed(2)));
      } else {
        result.push(null);
      }
    }

    return result;
  }

  /**
   * Calculate Exponential Moving Average (EMA)
   */
  static calculateEMA(values: number[], period: number): (number | null)[] {
    const result: (number | null)[] = [];
    const multiplier = 2 / (period + 1);

    let smaSum = 0;
    for (let i = 0; i < values.length; i++) {
      if (i < period - 1) {
        smaSum += values[i];
        result.push(null);
      } else if (i === period - 1) {
        smaSum += values[i];
        const initialEMA = smaSum / period;
        result.push(Number(initialEMA.toFixed(2)));
      } else {
        const prevEMA = result[i - 1]!;
        const currentEMA = (values[i] - prevEMA) * multiplier + prevEMA;
        result.push(Number(currentEMA.toFixed(2)));
      }
    }

    return result;
  }

  /**
   * Calculate RSI with Wilder's Smoothing (standard 14 period)
   */
  static calculateRSI(closes: number[], period = 14): (number | null)[] {
    const result: (number | null)[] = [];
    if (closes.length <= period) {
      return closes.map(() => null);
    }

    const gains: number[] = [0];
    const losses: number[] = [0];

    for (let i = 1; i < closes.length; i++) {
      const diff = closes[i] - closes[i - 1];
      gains.push(diff > 0 ? diff : 0);
      losses.push(diff < 0 ? Math.abs(diff) : 0);
    }

    // First average gain/loss
    let avgGain = 0;
    let avgLoss = 0;
    for (let i = 1; i <= period; i++) {
      avgGain += gains[i];
      avgLoss += losses[i];
      result.push(null);
    }
    result.push(null); // align index 0..period-1

    avgGain /= period;
    avgLoss /= period;

    // RSI at index period
    let rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
    let rsi = avgLoss === 0 ? 100 : 100 - 100 / (1 + rs);
    result[period] = Number(rsi.toFixed(2));

    // Subsequent values using Wilder's smoothing
    for (let i = period + 1; i < closes.length; i++) {
      avgGain = (avgGain * (period - 1) + gains[i]) / period;
      avgLoss = (avgLoss * (period - 1) + losses[i]) / period;

      if (avgLoss === 0) {
        rsi = 100;
      } else {
        rs = avgGain / avgLoss;
        rsi = 100 - 100 / (1 + rs);
      }
      result.push(Number(rsi.toFixed(2)));
    }

    return result;
  }

  /**
   * Calculate MACD (Fast: 12, Slow: 26, Signal: 9)
   */
  static calculateMACD(
    closes: number[],
    fastPeriod = 12,
    slowPeriod = 26,
    signalPeriod = 9
  ): {
    macd: (number | null)[];
    signal: (number | null)[];
    histogram: (number | null)[];
  } {
    const fastEMA = this.calculateEMA(closes, fastPeriod);
    const slowEMA = this.calculateEMA(closes, slowPeriod);

    const macdLine: (number | null)[] = [];
    for (let i = 0; i < closes.length; i++) {
      const fast = fastEMA[i];
      const slow = slowEMA[i];
      if (fast !== null && slow !== null) {
        macdLine.push(Number((fast - slow).toFixed(2)));
      } else {
        macdLine.push(null);
      }
    }

    // Calculate signal line (EMA of MACD line)
    const validMacdIndices = macdLine
      .map((val, idx) => (val !== null ? idx : -1))
      .filter((idx) => idx !== -1);

    const validMacdValues = macdLine.filter((val): val is number => val !== null);
    const signalValues = this.calculateEMA(validMacdValues, signalPeriod);

    const signalLine: (number | null)[] = closes.map(() => null);
    const histogram: (number | null)[] = closes.map(() => null);

    validMacdIndices.forEach((origIdx, vIdx) => {
      const sig = signalValues[vIdx];
      const m = macdLine[origIdx];
      signalLine[origIdx] = sig;
      if (m !== null && sig !== null) {
        histogram[origIdx] = Number((m - sig).toFixed(2));
      }
    });

    return {
      macd: macdLine,
      signal: signalLine,
      histogram,
    };
  }

  /**
   * Calculate Average True Range (ATR 14)
   */
  static calculateATR(candles: NormalizedPriceCandle[], period = 14): (number | null)[] {
    if (candles.length < 2) {
      return candles.map(() => null);
    }

    const trueRanges: number[] = [candles[0].high - candles[0].low];

    for (let i = 1; i < candles.length; i++) {
      const high = candles[i].high;
      const low = candles[i].low;
      const prevClose = candles[i - 1].close;

      const tr = Math.max(
        high - low,
        Math.abs(high - prevClose),
        Math.abs(low - prevClose)
      );
      trueRanges.push(tr);
    }

    const result: (number | null)[] = [];
    let sum = 0;

    for (let i = 0; i < trueRanges.length; i++) {
      if (i < period - 1) {
        sum += trueRanges[i];
        result.push(null);
      } else if (i === period - 1) {
        sum += trueRanges[i];
        result.push(Number((sum / period).toFixed(2)));
      } else {
        const prevATR = result[i - 1]!;
        const currentATR = (prevATR * (period - 1) + trueRanges[i]) / period;
        result.push(Number(currentATR.toFixed(2)));
      }
    }

    return result;
  }

  /**
   * Calculate Relative Volume (current volume vs 20-day SMA volume)
   */
  static calculateRelativeVolume(volumes: number[], period = 20): number {
    if (volumes.length === 0) return 1.0;
    const currentVolume = volumes[volumes.length - 1];
    const prevVolumes = volumes.slice(Math.max(0, volumes.length - 1 - period), volumes.length - 1);
    if (prevVolumes.length === 0) return 1.0;

    const avgVol = prevVolumes.reduce((acc, v) => acc + v, 0) / prevVolumes.length;
    if (avgVol === 0) return 1.0;

    return Number((currentVolume / avgVol).toFixed(2));
  }

  /**
   * Calculate 30-day annualized volatility from daily returns
   */
  static calculateVolatility30d(closes: number[]): number {
    if (closes.length < 5) return 0;
    const recentCloses = closes.slice(-30);
    const returns: number[] = [];

    for (let i = 1; i < recentCloses.length; i++) {
      if (recentCloses[i - 1] > 0) {
        returns.push(Math.log(recentCloses[i] / recentCloses[i - 1]));
      }
    }

    if (returns.length < 2) return 0;
    const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
    const variance =
      returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / (returns.length - 1);
    const dailyStdDev = Math.sqrt(variance);

    // Annualized volatility (~252 trading days)
    return Number((dailyStdDev * Math.sqrt(252) * 100).toFixed(2));
  }

  /**
   * Full calculation pipeline across candles sorted chronologically (oldest to newest)
   */
  static calculateAll(rawCandles: NormalizedPriceCandle[]): IndicatorCalculationResult {
    // Ensure chronological order
    const candles = [...rawCandles].sort(
      (a, b) => new Date(a.tradeDate).getTime() - new Date(b.tradeDate).getTime()
    );

    const closes = candles.map((c) => c.close);
    const volumes = candles.map((c) => c.volume);

    const sma20 = this.calculateSMA(closes, 20);
    const sma50 = this.calculateSMA(closes, 50);
    const sma200 = this.calculateSMA(closes, 200);
    const ema20 = this.calculateEMA(closes, 20);
    const rsi14 = this.calculateRSI(closes, 14);
    const macdData = this.calculateMACD(closes, 12, 26, 9);
    const atr14 = this.calculateATR(candles, 14);
    const relVolume = this.calculateRelativeVolume(volumes, 20);
    const vol30d = this.calculateVolatility30d(closes);

    const history: NormalizedTechnicalIndicators[] = candles.map((candle, idx) => {
      const c = candle.close;
      const s20 = sma20[idx];
      const s50 = sma50[idx];

      let trendSummary: 'bullish' | 'bearish' | 'neutral' = 'neutral';
      if (s20 !== null && s50 !== null) {
        if (c > s20 && s20 > s50) trendSummary = 'bullish';
        else if (c < s20 && s20 < s50) trendSummary = 'bearish';
      }

      return {
        tradeDate: candle.tradeDate,
        close: c,
        sma20: s20,
        sma50: s50,
        sma200: sma200[idx],
        ema20: ema20[idx],
        rsi14: rsi14[idx],
        macd: macdData.macd[idx],
        macdSignal: macdData.signal[idx],
        macdHistogram: macdData.histogram[idx],
        atr14: atr14[idx],
        relativeVolume: idx === candles.length - 1 ? relVolume : 1.0,
        trendSummary,
      };
    });

    const latest = history[history.length - 1] || {
      tradeDate: new Date().toISOString().split('T')[0],
      close: 0,
      sma20: null,
      sma50: null,
      sma200: null,
      ema20: null,
      rsi14: null,
      macd: null,
      macdSignal: null,
      macdHistogram: null,
      atr14: null,
      relativeVolume: 1.0,
      trendSummary: 'neutral',
    };

    return {
      indicators: latest,
      history,
      trend: latest.trendSummary || 'neutral',
      volatility30d: vol30d,
      relativeVolume: relVolume,
    };
  }
}
