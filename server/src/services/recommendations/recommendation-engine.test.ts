import { describe, expect, it } from 'vitest';
import { RecommendationEngine } from './recommendation-engine';
import {
  NormalizedFinancials,
  NormalizedPriceCandle,
  NormalizedQuote,
  NormalizedRatios,
  NormalizedShareholding,
  NormalizedStockProfile,
  NormalizedTechnicalIndicators,
} from '../market-data/types';

describe('RecommendationEngine', () => {
  const engine = new RecommendationEngine();

  const mockQuote: NormalizedQuote = {
    symbol: 'TESTCORP',
    companyName: 'Test Corp India Ltd',
    price: 1500,
    prevClose: 1480,
    change: 20,
    changePct: 1.35,
    volume: 500000,
    tradeDate: '2026-10-13',
    source: 'BharatStock EOD',
    isRealTime: false,
    isDelayed: false,
    isEod: true,
    exchange: 'NSE',
  };

  const mockProfile: NormalizedStockProfile = {
    symbol: 'TESTCORP',
    companyName: 'Test Corp India Ltd',
    exchange: 'NSE',
    isActive: true,
  };

  const mockCandles: NormalizedPriceCandle[] = Array.from({ length: 40 }, (_, i) => ({
    tradeDate: `2026-09-${String((i % 25) + 1).padStart(2, '0')}`,
    open: 1400 + i * 2.5,
    high: 1410 + i * 2.5,
    low: 1395 + i * 2.5,
    close: 1405 + i * 2.5,
    volume: 400000,
    adjustedClose: 1405 + i * 2.5,
    adjustmentFactor: 1.0,
  }));

  const mockTechnicals: NormalizedTechnicalIndicators = {
    tradeDate: '2026-10-13',
    close: 1500,
    sma20: 1460,
    sma50: 1420,
    sma200: 1300,
    ema20: 1465,
    rsi14: 62.5,
    macd: 8.5,
    macdSignal: 6.2,
    macdHistogram: 2.3,
    atr14: 25,
    relativeVolume: 1.25,
    trendSummary: 'bullish',
  };

  const mockFinancials: NormalizedFinancials[] = [
    {
      periodType: 'quarterly',
      periodEndDate: '2026-06-30',
      revenue: 50000000000,
      operatingProfit: 12000000000,
      netProfit: 8000000000,
      debtEquityRatio: 0.25,
      cashFlowOperating: 11000000000,
      capex: 3000000000,
      freeCashFlow: 8000000000,
    },
    {
      periodType: 'quarterly',
      periodEndDate: '2026-03-31',
      revenue: 47000000000,
      operatingProfit: 11000000000,
      netProfit: 7400000000,
    },
    {
      periodType: 'quarterly',
      periodEndDate: '2025-12-31',
      revenue: 45000000000,
      netProfit: 7000000000,
    },
    {
      periodType: 'quarterly',
      periodEndDate: '2025-09-30',
      revenue: 43000000000,
      netProfit: 6800000000,
    },
    {
      periodType: 'quarterly',
      periodEndDate: '2025-06-30', // YoY comparison period
      revenue: 42000000000,
      operatingProfit: 9500000000,
      netProfit: 6500000000,
    },
  ];

  const mockRatios: NormalizedRatios = {
    asOfDate: '2026-10-12',
    price: 1500,
    peRatio: 22.5,
    pbRatio: 2.8,
    roe: 18.2,
    roce: 21.4,
    dividendYield: 1.2,
  };

  const mockShareholding: NormalizedShareholding[] = [
    {
      asOnDate: '2026-06-30',
      promoterPct: 54.2,
      publicPct: 45.8,
    },
  ];

  it('classifies strong technical momentum as favorable for short-term', () => {
    const rec = engine.evaluateShortTerm(
      mockQuote,
      mockCandles,
      mockTechnicals,
      22.0, // 30-day volatility
      1.3 // relative volume
    );

    expect(rec.horizon).toBe('short_term');
    expect(rec.score).toBeGreaterThanOrEqual(70);
    expect(rec.classification).toBe('favorable');
    expect(rec.positiveFactors.length).toBeGreaterThan(0);
    expect(rec.disclaimer).toContain('do not guarantee');
  });

  it('classifies high-quality balance sheet and growth as favorable for long-term', () => {
    const rec = engine.evaluateLongTerm(
      mockQuote,
      mockProfile,
      mockFinancials,
      mockRatios,
      mockShareholding
    );

    expect(rec.horizon).toBe('long_term');
    expect(rec.score).toBeGreaterThanOrEqual(70);
    expect(rec.classification).toBe('favorable');
    expect(rec.allFactors).toHaveLength(5);
  });

  it('honestly returns insufficient_data when candles are missing', () => {
    const rec = engine.evaluateShortTerm(
      mockQuote,
      [], // No candles
      mockTechnicals,
      0,
      1.0
    );

    expect(rec.classification).toBe('insufficient_data');
    expect(rec.score).toBe(0);
    expect(rec.missingData.length).toBeGreaterThan(0);
  });

  it('honestly returns insufficient_data when financials are missing', () => {
    const rec = engine.evaluateLongTerm(
      mockQuote,
      mockProfile,
      [], // No financials
      mockRatios,
      mockShareholding
    );

    expect(rec.classification).toBe('insufficient_data');
    expect(rec.missingData).toContain('Quarterly and Annual Financial Statements');
  });

  it('correctly flags elevated valuation and high debt as important risks', () => {
    const expensiveRatios: NormalizedRatios = {
      ...mockRatios,
      peRatio: 85.0, // Rich valuation
    };

    const leveragedFinancials: NormalizedFinancials[] = [
      {
        ...mockFinancials[0],
        debtEquityRatio: 3.2, // High leverage
        netProfit: -1000000000, // Loss
      },
      ...mockFinancials.slice(1),
    ];

    const rec = engine.evaluateLongTerm(
      mockQuote,
      mockProfile,
      leveragedFinancials,
      expensiveRatios,
      mockShareholding
    );

    expect(rec.score).toBeLessThan(50);
    expect(rec.classification).toBe('unfavorable');
    expect(rec.importantRisks.some((r) => r.includes('valuation') || r.includes('P/E'))).toBe(true);
    expect(rec.importantRisks.some((r) => r.includes('debt') || r.includes('leverage'))).toBe(true);
  });
});
