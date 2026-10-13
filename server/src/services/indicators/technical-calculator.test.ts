import { describe, expect, it } from 'vitest';
import { TechnicalCalculator } from './technical-calculator';
import { NormalizedPriceCandle } from '../market-data/types';

describe('TechnicalCalculator', () => {
  it('calculates SMA correctly with exact window smoothing', () => {
    const prices = [10, 20, 30, 40, 50];
    const sma3 = TechnicalCalculator.calculateSMA(prices, 3);

    expect(sma3[0]).toBeNull();
    expect(sma3[1]).toBeNull();
    expect(sma3[2]).toBe(20); // (10+20+30)/3 = 20
    expect(sma3[3]).toBe(30); // (20+30+40)/3 = 30
    expect(sma3[4]).toBe(40); // (30+40+50)/3 = 40
  });

  it('calculates EMA correctly with smoothing multiplier', () => {
    const prices = [10, 11, 12, 13, 14, 15];
    const ema3 = TechnicalCalculator.calculateEMA(prices, 3);

    expect(ema3[0]).toBeNull();
    expect(ema3[1]).toBeNull();
    expect(ema3[2]).toBe(11); // Initial SMA is (10+11+12)/3 = 11
    expect(ema3[3]).toBe(12);
    expect(ema3[4]).toBe(13);
    expect(ema3[5]).toBe(14);
  });

  it('calculates RSI 14 within 0 to 100 boundaries', () => {
    // 25 prices monotonically increasing
    const upPrices = Array.from({ length: 25 }, (_, i) => 100 + i * 2);
    const upRsi = TechnicalCalculator.calculateRSI(upPrices, 14);

    expect(upRsi[13]).toBeNull();
    const lastRsi = upRsi[upRsi.length - 1];
    expect(lastRsi).not.toBeNull();
    expect(lastRsi!).toBe(100); // 100% gains

    // Alternating prices
    const altPrices = Array.from({ length: 30 }, (_, i) => 100 + (i % 2 === 0 ? 5 : -5));
    const altRsi = TechnicalCalculator.calculateRSI(altPrices, 14);
    const lastAlt = altRsi[altRsi.length - 1];
    expect(lastAlt).toBeGreaterThan(30);
    expect(lastAlt).toBeLessThan(70);
  });

  it('calculates MACD with line, signal, and histogram', () => {
    const prices = Array.from({ length: 40 }, (_, i) => 100 + Math.sin(i / 5) * 10);
    const macdResult = TechnicalCalculator.calculateMACD(prices, 12, 26, 9);

    expect(macdResult.macd).toHaveLength(40);
    expect(macdResult.signal).toHaveLength(40);
    expect(macdResult.histogram).toHaveLength(40);

    // Warm-up periods should be null
    expect(macdResult.macd[10]).toBeNull();
    expect(macdResult.macd[26]).not.toBeNull();
  });

  it('calculates Relative Volume and Volatility', () => {
    const volumes = [100, 100, 100, 100, 100, 200];
    const relVol = TechnicalCalculator.calculateRelativeVolume(volumes, 5);
    expect(relVol).toBe(2.0); // 200 / 100 = 2.0x

    const flatCloses = Array.from({ length: 30 }, () => 100);
    const flatVol = TechnicalCalculator.calculateVolatility30d(flatCloses);
    expect(flatVol).toBe(0);

    const volatileCloses = Array.from({ length: 30 }, (_, i) => (i % 2 === 0 ? 100 : 105));
    const highVol = TechnicalCalculator.calculateVolatility30d(volatileCloses);
    expect(highVol).toBeGreaterThan(10);
  });

  it('executes full calculateAll pipeline on candles', () => {
    const sampleCandles: NormalizedPriceCandle[] = Array.from({ length: 60 }, (_, i) => ({
      tradeDate: `2026-08-${String((i % 25) + 1).padStart(2, '0')}`,
      open: 100 + i,
      high: 102 + i,
      low: 99 + i,
      close: 101 + i,
      volume: 10000 + i * 100,
      adjustedClose: 101 + i,
      adjustmentFactor: 1.0,
    }));

    const result = TechnicalCalculator.calculateAll(sampleCandles);
    expect(result.indicators).toBeDefined();
    expect(result.indicators.sma20).not.toBeNull();
    expect(result.indicators.sma50).not.toBeNull();
    expect(result.trend).toBe('bullish');
    expect(result.history).toHaveLength(60);
  });
});
