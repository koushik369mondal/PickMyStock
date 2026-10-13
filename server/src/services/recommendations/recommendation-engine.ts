import {
  NormalizedFinancials,
  NormalizedPriceCandle,
  NormalizedQuote,
  NormalizedRatios,
  NormalizedShareholding,
  NormalizedStockProfile,
  NormalizedTechnicalIndicators,
} from '../market-data/types';

export type RecommendationHorizon = 'short_term' | 'long_term';
export type RecommendationClassification =
  | 'favorable'
  | 'neutral'
  | 'unfavorable'
  | 'insufficient_data';

export interface FactorEvidence {
  id: string;
  name: string;
  weight: number; // 0.0 - 1.0
  score: number; // 0 - 100
  value: string | number | null;
  calculation: string;
  interpretation: string;
  source: string;
  status: 'positive' | 'negative' | 'neutral' | 'missing';
}

export interface HorizonRecommendation {
  horizon: RecommendationHorizon;
  score: number;
  classification: RecommendationClassification;
  confidence: 'high' | 'medium' | 'low';
  dataTimestamp: string;
  positiveFactors: FactorEvidence[];
  negativeFactors: FactorEvidence[];
  allFactors: FactorEvidence[];
  importantRisks: string[];
  missingData: string[];
  explanation: string;
  disclaimer: string;
}

export interface StockRecommendationResponse {
  symbol: string;
  companyName: string;
  price: number;
  dataTimestamp: string;
  shortTerm: HorizonRecommendation;
  longTerm: HorizonRecommendation;
  overallSummary: string;
  disclaimer: string;
}

export interface RecommendationEngineConfig {
  shortTermWeights: {
    priceMomentum: number;
    trendStrength: number;
    rsiMomentum: number;
    relativeVolume: number;
    volatilityRisk: number;
  };
  longTermWeights: {
    growth: number;
    financialHealth: number;
    valuation: number;
    profitability: number;
    stabilityGovernance: number;
  };
  thresholds: {
    favorableMin: number;
    neutralMin: number;
  };
}

export const DEFAULT_CONFIG: RecommendationEngineConfig = {
  shortTermWeights: {
    priceMomentum: 0.3,
    trendStrength: 0.25,
    rsiMomentum: 0.15,
    relativeVolume: 0.15,
    volatilityRisk: 0.15,
  },
  longTermWeights: {
    growth: 0.25,
    financialHealth: 0.25,
    valuation: 0.25,
    profitability: 0.15,
    stabilityGovernance: 0.1,
  },
  thresholds: {
    favorableMin: 70,
    neutralMin: 45,
  },
};

export class RecommendationEngine {
  private config: RecommendationEngineConfig;

  constructor(config: Partial<RecommendationEngineConfig> = {}) {
    this.config = {
      shortTermWeights: { ...DEFAULT_CONFIG.shortTermWeights, ...config.shortTermWeights },
      longTermWeights: { ...DEFAULT_CONFIG.longTermWeights, ...config.longTermWeights },
      thresholds: { ...DEFAULT_CONFIG.thresholds, ...config.thresholds },
    };
  }

  private classifyScore(score: number): RecommendationClassification {
    if (score >= this.config.thresholds.favorableMin) return 'favorable';
    if (score >= this.config.thresholds.neutralMin) return 'neutral';
    return 'unfavorable';
  }

  /**
   * Evaluates Short-Term recommendation (1-20 trading days) based on technicals and market price action
   */
  evaluateShortTerm(
    quote: NormalizedQuote,
    candles: NormalizedPriceCandle[],
    technicals: NormalizedTechnicalIndicators,
    volatility30d: number,
    relativeVolume: number
  ): HorizonRecommendation {
    const missingData: string[] = [];
    const importantRisks: string[] = [];
    const factors: FactorEvidence[] = [];

    const dataTimestamp = quote.tradeDate || technicals.tradeDate || new Date().toISOString();

    // Check data sufficiency
    if (!candles || candles.length < 20) {
      missingData.push('Insufficient price history (< 20 trading sessions)');
      return {
        horizon: 'short_term',
        score: 0,
        classification: 'insufficient_data',
        confidence: 'low',
        dataTimestamp,
        positiveFactors: [],
        negativeFactors: [],
        allFactors: [],
        importantRisks: ['Insufficient historical candles to reliably evaluate momentum and trend.'],
        missingData,
        explanation: 'Short-term technical score cannot be determined due to insufficient historical trading sessions.',
        disclaimer: 'This is a deterministic decision-support signal, not an investment guarantee.',
      };
    }

    const currentPrice = quote.price;
    const weights = this.config.shortTermWeights;

    // 1. Price Momentum (30%)
    // Return over 20-day and 5-day periods
    const p5DaysAgo = candles.length >= 5 ? candles[candles.length - 5].close : candles[0].close;
    const p20DaysAgo = candles.length >= 20 ? candles[candles.length - 20].close : candles[0].close;
    const ret5d = p5DaysAgo > 0 ? ((currentPrice - p5DaysAgo) / p5DaysAgo) * 100 : 0;
    const ret20d = p20DaysAgo > 0 ? ((currentPrice - p20DaysAgo) / p20DaysAgo) * 100 : 0;

    let momentumScore = 50;
    if (ret20d > 8 && ret5d > 1) momentumScore = 88;
    else if (ret20d > 4 && ret5d >= 0) momentumScore = 75;
    else if (ret20d > 0 && ret5d >= -1) momentumScore = 60;
    else if (ret20d > -4 && ret5d < 0) momentumScore = 40;
    else if (ret20d <= -4 && ret5d < -2) momentumScore = 20;
    else momentumScore = 35;

    factors.push({
      id: 'price_momentum',
      name: 'Price Momentum (5D & 20D)',
      weight: weights.priceMomentum,
      score: momentumScore,
      value: `5D: ${ret5d > 0 ? '+' : ''}${ret5d.toFixed(1)}%, 20D: ${ret20d > 0 ? '+' : ''}${ret20d.toFixed(1)}%`,
      calculation: 'Trailing 5-session and 20-session percentage price changes',
      interpretation:
        momentumScore >= 70
          ? 'Strong positive upward momentum across short-term windows.'
          : momentumScore >= 45
            ? 'Moderate or consolidating price action with mild momentum.'
            : 'Negative price momentum showing short-term selling pressure.',
      source: 'BharatStock Historical EOD Prices',
      status: momentumScore >= 70 ? 'positive' : momentumScore < 45 ? 'negative' : 'neutral',
    });

    // 2. Trend Strength (25%)
    // SMA 20, SMA 50, EMA 20
    let trendScore = 50;
    const s20 = technicals.sma20;
    const s50 = technicals.sma50;
    const e20 = technicals.ema20;

    if (s20 != null && s50 != null) {
      if (currentPrice > s20 && s20 > s50) {
        trendScore = currentPrice > (e20 ?? s20) ? 90 : 80;
      } else if (currentPrice > s20 && s20 <= s50) {
        trendScore = 65;
      } else if (currentPrice < s20 && s20 > s50) {
        trendScore = 45;
      } else if (currentPrice < s20 && s20 <= s50) {
        trendScore = 25;
      }
    } else {
      missingData.push('50-day SMA not available for trend confirmation');
      trendScore = currentPrice > (s20 ?? 0) ? 60 : 40;
    }

    factors.push({
      id: 'trend_strength',
      name: 'Moving Average Trend Alignment',
      weight: weights.trendStrength,
      score: trendScore,
      value: `Price: ₹${currentPrice}, SMA20: ₹${s20 ?? 'N/A'}, SMA50: ₹${s50 ?? 'N/A'}`,
      calculation: 'Alignment of current close relative to 20-day SMA and 50-day SMA',
      interpretation:
        trendScore >= 70
          ? 'Bullish moving average alignment; price is trading comfortably above rising moving averages.'
          : trendScore >= 45
            ? 'Mixed or transitioning trend signals across short and medium moving averages.'
            : 'Bearish alignment; price is suppressed beneath key downward-sloping averages.',
      source: 'PickMyStock Technical Indicator Engine',
      status: trendScore >= 70 ? 'positive' : trendScore < 45 ? 'negative' : 'neutral',
    });

    // 3. RSI Momentum Assessment (15%)
    const rsi = technicals.rsi14;
    let rsiScore = 50;
    if (rsi == null) {
      missingData.push('14-period RSI');
      rsiScore = 50;
    } else if (rsi >= 50 && rsi <= 68) {
      // Sweet spot for short-term continuation
      rsiScore = 85;
    } else if (rsi > 68 && rsi <= 78) {
      // Strong bullish but approaching overbought
      rsiScore = 70;
      importantRisks.push(`RSI is elevated at ${rsi.toFixed(1)}, signaling near-term overbought conditions.`);
    } else if (rsi > 78) {
      // Severely overbought
      rsiScore = 35;
      importantRisks.push(`Extreme overbought RSI (${rsi.toFixed(1)}) increases mean-reversion pullback risk.`);
    } else if (rsi >= 40 && rsi < 50) {
      rsiScore = 55;
    } else if (rsi >= 30 && rsi < 40) {
      rsiScore = 40;
    } else {
      // Below 30: oversold
      rsiScore = 45; // Neutral-low in short term until reversal confirmation
      importantRisks.push(`RSI is oversold (${rsi.toFixed(1)}); trend is weak despite potential bounce.`);
    }

    factors.push({
      id: 'rsi_momentum',
      name: 'RSI (14) Momentum Assessment',
      weight: weights.rsiMomentum,
      score: rsiScore,
      value: rsi != null ? `${rsi.toFixed(1)}` : 'Missing',
      calculation: "Wilder's 14-period Relative Strength Index",
      interpretation:
        rsiScore >= 70
          ? 'Healthy bullish momentum in the 50-70 expansion zone.'
          : rsiScore >= 45
            ? 'RSI indicates equilibrium with no acute momentum divergence.'
            : 'Deteriorating RSI momentum or elevated overbought/oversold risk.',
      source: 'PickMyStock Technical Indicator Engine',
      status: rsiScore >= 70 ? 'positive' : rsiScore < 45 ? 'negative' : 'neutral',
    });

    // 4. Relative Trading Volume (15%)
    let volScore = 50;
    if (relativeVolume >= 1.5) {
      volScore = ret5d >= 0 ? 88 : 25; // High volume with positive move = accumulation, negative = distribution
      if (ret5d < 0) {
        importantRisks.push(`High relative volume (${relativeVolume}x) on declining price signals institutional distribution.`);
      }
    } else if (relativeVolume >= 1.0) {
      volScore = ret5d >= 0 ? 70 : 45;
    } else if (relativeVolume >= 0.7) {
      volScore = 50;
    } else {
      volScore = 35;
      importantRisks.push('Low relative volume indicates lackluster market participation.');
    }

    factors.push({
      id: 'relative_volume',
      name: 'Relative Volume Activity',
      weight: weights.relativeVolume,
      score: volScore,
      value: `${relativeVolume.toFixed(2)}x vs 20D SMA`,
      calculation: 'Current session volume divided by 20-day average volume',
      interpretation:
        volScore >= 70
          ? 'Strong volume expansion validating prevailing price movement.'
          : volScore >= 45
            ? 'Volume is in line with normal 20-day trading norms.'
            : 'Subdued volume or distribution pressure.',
      source: 'BharatStock Daily Trading Volumes',
      status: volScore >= 70 ? 'positive' : volScore < 45 ? 'negative' : 'neutral',
    });

    // 5. Volatility and Downside Risk (15%)
    let volRiskScore = 50;
    if (volatility30d <= 20) {
      volRiskScore = 80; // Low, predictable volatility
    } else if (volatility30d <= 35) {
      volRiskScore = 65;
    } else if (volatility30d <= 55) {
      volRiskScore = 40;
      importantRisks.push(`Elevated 30-day volatility (${volatility30d.toFixed(1)}%) increases stop-out risk.`);
    } else {
      volRiskScore = 20;
      importantRisks.push(`Extreme volatility (${volatility30d.toFixed(1)}%) suggests sharp potential drawdowns.`);
    }

    factors.push({
      id: 'volatility_risk',
      name: '30-Day Volatility & Downside Risk',
      weight: weights.volatilityRisk,
      score: volRiskScore,
      value: `${volatility30d.toFixed(1)}% Annualized`,
      calculation: 'Standard deviation of log returns over past 30 sessions annualized (sqrt(252))',
      interpretation:
        volRiskScore >= 70
          ? 'Controlled volatility with favorable short-term risk/reward containment.'
          : volRiskScore >= 45
            ? 'Moderate price swings typical of broader market behavior.'
            : 'Wide price swings with heightened adverse excursion risk.',
      source: 'PickMyStock Volatility Models',
      status: volRiskScore >= 70 ? 'positive' : volRiskScore < 45 ? 'negative' : 'neutral',
    });

    // Aggregate weighted score
    let shortTermScore = Math.round(
      factors.reduce((sum, f) => sum + f.score * f.weight, 0)
    );

    // Apply risk override: if volatility is extreme and momentum negative, cap score
    if (volatility30d > 50 && momentumScore < 40) {
      shortTermScore = Math.min(shortTermScore, 42);
    }

    const classification = this.classifyScore(shortTermScore);
    const confidence = missingData.length === 0 ? 'high' : missingData.length === 1 ? 'medium' : 'low';

    const positiveFactors = factors.filter((f) => f.status === 'positive');
    const negativeFactors = factors.filter((f) => f.status === 'negative');

    let explanation = '';
    if (classification === 'favorable') {
      explanation = `${quote.symbol} displays a favorable short-term structure (score: ${shortTermScore}/100) supported by ${positiveFactors.map((f) => f.name).join(' and ')}. Price action remains constructive above moving averages.`;
    } else if (classification === 'neutral') {
      explanation = `${quote.symbol} reflects a neutral short-term posture (score: ${shortTermScore}/100). Technical signals are balanced between consolidation and selective trend tests without a dominant directional bias.`;
    } else {
      explanation = `${quote.symbol} shows an unfavorable short-term risk/reward profile (score: ${shortTermScore}/100). Elevated downside momentum, distribution volume, or unfavorable moving average alignment present headwind risks.`;
    }

    return {
      horizon: 'short_term',
      score: shortTermScore,
      classification,
      confidence,
      dataTimestamp,
      positiveFactors,
      negativeFactors,
      allFactors: factors,
      importantRisks,
      missingData,
      explanation,
      disclaimer: 'Short-term signals reflect historical price action patterns (1-20 trading days) and do not guarantee future performance.',
    };
  }

  /**
   * Evaluates Long-Term recommendation (1-3 years) based on fundamental growth, health, valuation, and governance
   */
  evaluateLongTerm(
    quote: NormalizedQuote,
    profile: NormalizedStockProfile,
    financials: NormalizedFinancials[],
    ratios: NormalizedRatios,
    shareholding: NormalizedShareholding[]
  ): HorizonRecommendation {
    const missingData: string[] = [];
    const importantRisks: string[] = [];
    const factors: FactorEvidence[] = [];

    const dataTimestamp =
      ratios.asOfDate ||
      (financials.length > 0 ? financials[0].periodEndDate : quote.tradeDate) ||
      new Date().toISOString();

    const weights = this.config.longTermWeights;

    // Check financial statements presence
    if (!financials || financials.length === 0) {
      missingData.push('Quarterly and Annual Financial Statements');
      return {
        horizon: 'long_term',
        score: 0,
        classification: 'insufficient_data',
        confidence: 'low',
        dataTimestamp,
        positiveFactors: [],
        negativeFactors: [],
        allFactors: [],
        importantRisks: ['No regulatory financial disclosures available to calculate fundamental health and valuation.'],
        missingData,
        explanation: 'Long-term investment signal cannot be determined due to unavailable financial statements.',
        disclaimer: 'Fundamental research signals rely on reported regulatory disclosures and do not guarantee investment returns.',
      };
    }

    // 1. Revenue & Earnings Growth (25%)
    // Compare latest quarter vs 4 quarters ago, or latest annual vs prior annual
    const latestFin = financials[0];
    const prevFin = financials.length >= 4 ? financials[4] : financials[1];

    let growthScore = 50;
    let growthDesc = 'Insufficient periods for YoY growth';

    if (latestFin && prevFin && latestFin.revenue && prevFin.revenue && prevFin.revenue > 0) {
      const revGrowth = ((latestFin.revenue - prevFin.revenue) / prevFin.revenue) * 100;
      let profitGrowth = 0;
      if (latestFin.netProfit && prevFin.netProfit && prevFin.netProfit > 0) {
        profitGrowth = ((latestFin.netProfit - prevFin.netProfit) / prevFin.netProfit) * 100;
      }

      growthDesc = `Revenue YoY: ${revGrowth.toFixed(1)}%, PAT YoY: ${profitGrowth.toFixed(1)}%`;

      if (revGrowth > 15 && profitGrowth > 15) growthScore = 90;
      else if (revGrowth > 10 && profitGrowth > 8) growthScore = 78;
      else if (revGrowth > 5 && profitGrowth >= 0) growthScore = 62;
      else if (revGrowth >= 0 && profitGrowth < 0) growthScore = 45;
      else if (revGrowth < 0 && profitGrowth < -10) growthScore = 25;
      else growthScore = 35;

      if (profitGrowth < -20) {
        importantRisks.push(`Severe earnings contraction of ${profitGrowth.toFixed(1)}% YoY in latest reported period.`);
      }
    } else {
      missingData.push('Historical revenue/profit series for YoY growth comparison');
      growthScore = 50;
    }

    factors.push({
      id: 'growth',
      name: 'Revenue & Earnings Growth',
      weight: weights.growth,
      score: growthScore,
      value: growthDesc,
      calculation: 'YoY percentage change in top-line revenue and net profit across reporting periods',
      interpretation:
        growthScore >= 70
          ? 'Robust compounding of revenue and profitability above industry baselines.'
          : growthScore >= 45
            ? 'Moderate or stable financial growth in line with macroeconomic trends.'
            : 'Stagnant or declining top-line and earnings trajectory.',
      source: 'BharatStock Integrated Financial Disclosures',
      status: growthScore >= 70 ? 'positive' : growthScore < 45 ? 'negative' : 'neutral',
    });

    // 2. Financial Health & Cash Flow (25%)
    // Debt-to-Equity, Operating Cash Flow, Free Cash Flow
    let healthScore = 50;
    const deRatio = latestFin.debtEquityRatio;
    const cfo = latestFin.cashFlowOperating;
    const fcf = latestFin.freeCashFlow;

    if (deRatio !== null && deRatio !== undefined) {
      if (deRatio < 0.3) healthScore = 85;
      else if (deRatio <= 0.8) healthScore = 72;
      else if (deRatio <= 1.5) healthScore = 55;
      else if (deRatio <= 2.5) {
        healthScore = 35;
        importantRisks.push(`Elevated debt-to-equity ratio of ${deRatio.toFixed(2)}x increases leverage and interest sensitivity.`);
      } else {
        healthScore = 20;
        importantRisks.push(`High leverage (D/E: ${deRatio.toFixed(2)}x) introduces solvency and refinancing risk.`);
      }
    } else {
      missingData.push('Debt-to-equity ratio');
    }

    // Boost or penalize if Cash Flow data exists
    if (cfo !== null && cfo !== undefined) {
      if (cfo > 0) {
        healthScore = Math.min(100, healthScore + 8);
      } else {
        healthScore = Math.max(0, healthScore - 12);
        importantRisks.push('Negative operating cash flow reported in the latest fiscal filing.');
      }
    }

    factors.push({
      id: 'financial_health',
      name: 'Financial Health, Debt & Cash Flow',
      weight: weights.financialHealth,
      score: healthScore,
      value: `D/E: ${deRatio !== null && deRatio !== undefined ? `${deRatio.toFixed(2)}x` : 'N/A'}${fcf ? `, FCF: ₹${(fcf / 1e7).toFixed(1)} Cr` : ''}`,
      calculation: 'Debt-to-equity ratio and operating cash flow generation capability',
      interpretation:
        healthScore >= 70
          ? 'Clean balance sheet with low leverage and self-sustaining cash conversion.'
          : healthScore >= 45
            ? 'Manageable debt obligations within sustainable operating capacity.'
            : 'High debt burden or negative cash flows imposing financial drag.',
      source: 'BharatStock Balance Sheet & Cash Flow Disclosures',
      status: healthScore >= 70 ? 'positive' : healthScore < 45 ? 'negative' : 'neutral',
    });

    // 3. Valuation (25%)
    // P/E ratio, P/B ratio, Dividend Yield vs benchmarks
    let valScore = 50;
    const pe = ratios.peRatio;
    const pb = ratios.pbRatio;

    if (pe !== null && pe !== undefined && pe > 0) {
      if (pe < 15) valScore = 90;
      else if (pe <= 25) valScore = 75;
      else if (pe <= 40) valScore = 55;
      else if (pe <= 70) {
        valScore = 35;
        importantRisks.push(`Valuation is elevated with a P/E multiple of ${pe.toFixed(1)}x, leaving little margin of safety.`);
      } else {
        valScore = 20;
        importantRisks.push(`Rich P/E valuation multiple of ${pe.toFixed(1)}x carries substantial multiple contraction risk.`);
      }
    } else if (pe !== null && pe !== undefined && pe <= 0) {
      // Negative PE implies net loss
      valScore = 20;
      importantRisks.push('Negative earnings (Loss) over trailing reporting periods.');
    } else {
      missingData.push('P/E valuation multiple');
      valScore = 50;
    }

    factors.push({
      id: 'valuation',
      name: 'Valuation Multiples (P/E, P/B)',
      weight: weights.valuation,
      score: valScore,
      value: `P/E: ${pe !== null && pe !== undefined ? `${pe.toFixed(1)}x` : 'N/A'}, P/B: ${pb !== null && pb !== undefined ? `${pb.toFixed(2)}x` : 'N/A'}`,
      calculation: 'Latest price divided by TTM EPS (P/E) and Book Value per share (P/B)',
      interpretation:
        valScore >= 70
          ? 'Attractive valuation multiples providing reasonable margin of safety.'
          : valScore >= 45
            ? 'Fairly valued in accordance with ongoing market standards.'
            : 'Premium valuation with high earnings expectations priced into the stock.',
      source: 'BharatStock Valuation Ratios Service',
      status: valScore >= 70 ? 'positive' : valScore < 45 ? 'negative' : 'neutral',
    });

    // 4. Profitability: ROE and ROCE (15%)
    let profScore = 50;
    const roe = ratios.roe;
    const roce = ratios.roce;

    if (roe !== null && roe !== undefined) {
      if (roe > 20) profScore = 90;
      else if (roe >= 15) profScore = 80;
      else if (roe >= 10) profScore = 60;
      else if (roe >= 5) profScore = 40;
      else {
        profScore = 25;
        importantRisks.push(`Low return on equity (${roe.toFixed(1)}%) reflects sub-par capital efficiency.`);
      }
    } else {
      missingData.push('Return on Equity (ROE)');
      profScore = 50;
    }

    factors.push({
      id: 'profitability',
      name: 'Capital Efficiency (ROE & ROCE)',
      weight: weights.profitability,
      score: profScore,
      value: `ROE: ${roe !== null && roe !== undefined ? `${roe.toFixed(1)}%` : 'N/A'}, ROCE: ${roce !== null && roce !== undefined ? `${roce.toFixed(1)}%` : 'N/A'}`,
      calculation: 'Return on Equity (ROE) and Return on Capital Employed (ROCE)',
      interpretation:
        profScore >= 70
          ? 'High capital efficiency and shareholder value compounding capacity.'
          : profScore >= 45
            ? 'Acceptable capital productivity supporting baseline cost of equity.'
            : 'Subdued profitability metrics eroding long-term compounding.',
      source: 'BharatStock Financial Ratios',
      status: profScore >= 70 ? 'positive' : profScore < 45 ? 'negative' : 'neutral',
    });

    // 5. Business Stability & Governance (10%)
    // Promoter holding stability, FII/DII backing
    let govScore = 50;
    const latestShare = shareholding && shareholding.length > 0 ? shareholding[0] : null;

    if (latestShare) {
      const prom = latestShare.promoterPct;
      if (prom >= 50) govScore = 85;
      else if (prom >= 35) govScore = 70;
      else if (prom >= 20) govScore = 55;
      else {
        govScore = 40;
        importantRisks.push(`Low promoter holding (${prom.toFixed(1)}%) may lead to corporate governance vulnerability.`);
      }
    } else {
      missingData.push('Shareholding pattern');
      govScore = 50;
    }

    factors.push({
      id: 'stability_governance',
      name: 'Ownership Structure & Stability',
      weight: weights.stabilityGovernance,
      score: govScore,
      value: latestShare ? `Promoter: ${latestShare.promoterPct.toFixed(1)}%, Public: ${latestShare.publicPct.toFixed(1)}%` : 'Missing',
      calculation: 'Promoter and institutional shareholding concentration from SEBI filings',
      interpretation:
        govScore >= 70
          ? 'Strong promoter commitment and balanced institutional shareholding base.'
          : govScore >= 45
            ? 'Standard shareholding distribution without acute governance overhangs.'
            : 'Diluted ownership or low insider alignment.',
      source: 'BharatStock Shareholding Disclosures',
      status: govScore >= 70 ? 'positive' : govScore < 45 ? 'negative' : 'neutral',
    });

    // Calculate overall long term score
    let longTermScore = Math.round(
      factors.reduce((sum, f) => sum + f.score * f.weight, 0)
    );

    // Apply data-quality override: If critical metrics missing, reduce score
    if (missingData.length >= 2) {
      longTermScore = Math.min(longTermScore, 58);
    }

    const classification = this.classifyScore(longTermScore);
    const confidence = missingData.length === 0 ? 'high' : missingData.length <= 2 ? 'medium' : 'low';

    const positiveFactors = factors.filter((f) => f.status === 'positive');
    const negativeFactors = factors.filter((f) => f.status === 'negative');

    let explanation = '';
    if (classification === 'favorable') {
      explanation = `${quote.symbol} demonstrates favorable fundamental compounding credentials (score: ${longTermScore}/100) supported by ${positiveFactors.map((f) => f.name).join(' and ')}. Financial health and capital productivity support a 1-3 year horizon.`;
    } else if (classification === 'neutral') {
      explanation = `${quote.symbol} holds a neutral long-term stance (score: ${longTermScore}/100). Healthy characteristics are balanced by valuation constraints, moderate growth, or incomplete financial history.`;
    } else {
      explanation = `${quote.symbol} screens as unfavorable for long-term allocation (score: ${longTermScore}/100). Elevated valuation multiples, debt load, or deteriorating operating profits suggest caution.`;
    }

    return {
      horizon: 'long_term',
      score: longTermScore,
      classification,
      confidence,
      dataTimestamp,
      positiveFactors,
      negativeFactors,
      allFactors: factors,
      importantRisks,
      missingData,
      explanation,
      disclaimer: 'Long-term research scores reflect reported historical fundamentals and do not guarantee capital appreciation.',
    };
  }

  /**
   * Generates comprehensive dual-horizon stock recommendation
   */
  generateRecommendation(
    quote: NormalizedQuote,
    profile: NormalizedStockProfile,
    candles: NormalizedPriceCandle[],
    technicals: NormalizedTechnicalIndicators,
    volatility30d: number,
    relativeVolume: number,
    financials: NormalizedFinancials[],
    ratios: NormalizedRatios,
    shareholding: NormalizedShareholding[]
  ): StockRecommendationResponse {
    const shortTerm = this.evaluateShortTerm(
      quote,
      candles,
      technicals,
      volatility30d,
      relativeVolume
    );

    const longTerm = this.evaluateLongTerm(
      quote,
      profile,
      financials,
      ratios,
      shareholding
    );

    let overallSummary = '';
    if (shortTerm.classification === 'favorable' && longTerm.classification === 'favorable') {
      overallSummary = `${quote.symbol} exhibits dual-horizon strength, displaying both robust technical momentum for the short term and disciplined fundamental quality for long-term compounders.`;
    } else if (shortTerm.classification === 'favorable' && longTerm.classification !== 'favorable') {
      overallSummary = `${quote.symbol} is technically strong in the short term (tactical opportunity), but long-term fundamentals indicate valuation or balance-sheet caution.`;
    } else if (shortTerm.classification !== 'favorable' && longTerm.classification === 'favorable') {
      overallSummary = `${quote.symbol} represents a fundamentally attractive long-term business, currently undergoing short-term technical consolidation or price digestion.`;
    } else {
      overallSummary = `${quote.symbol} presents mixed or unfavorable risk/reward characteristics across both short-term momentum and fundamental valuation horizons.`;
    }

    return {
      symbol: quote.symbol,
      companyName: profile.companyName || quote.symbol,
      price: quote.price,
      dataTimestamp: quote.tradeDate || new Date().toISOString(),
      shortTerm,
      longTerm,
      overallSummary,
      disclaimer:
        'PickMyStock is a quantitative research and analytical platform. All signals and scores are explainable heuristic assessments of verified historical market data and regulatory disclosures, not personalized financial advice or guaranteed profit predictions.',
    };
  }
}

export const recommendationEngine = new RecommendationEngine();
