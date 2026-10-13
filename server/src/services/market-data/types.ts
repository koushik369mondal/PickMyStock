/**
 * Normalized market data types for PickMyStock.
 * Shields the application from provider-specific formats.
 */

export interface NormalizedStockProfile {
  symbol: string;
  isin?: string;
  companyName: string;
  sector?: string;
  industry?: string;
  exchange: 'NSE' | 'BSE' | string;
  faceValue?: number;
  marketCapRank?: number;
  marketCap?: number;
  listingDate?: string;
  isActive: boolean;
  dataCoverage?: {
    financialsQuarterlyCurrent?: boolean;
    financialsAnnual?: boolean;
    dailyPrices?: boolean;
    corporateActions?: boolean;
    sectorIndustry?: boolean;
  };
}

export interface NormalizedQuote {
  symbol: string;
  companyName?: string;
  price: number;
  prevClose: number;
  change: number;
  changePct: number;
  volume: number;
  turnoverLakhs?: number;
  deliveryPct?: number | null;
  tradeDate: string;
  source: string;
  isRealTime: boolean;
  isDelayed: boolean;
  isEod: boolean;
  exchange: string;
}

export interface NormalizedPriceCandle {
  tradeDate: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  turnoverLakhs?: number;
  deliveryPct?: number | null;
  adjustedClose: number;
  adjustmentFactor: number;
}

export interface NormalizedFinancials {
  periodType: 'quarterly' | 'annual';
  fiscalYear?: string;
  periodEndDate: string;
  revenue?: number | null;
  operatingProfit?: number | null;
  ebitda?: number | null;
  netProfit?: number | null;
  eps?: number | null;
  debtEquityRatio?: number | null;
  cashFlowOperating?: number | null;
  capex?: number | null;
  freeCashFlow?: number | null;
  consolidationType?: string;
  totalAssets?: number | null;
  totalLiabilities?: number | null;
  totalEquity?: number | null;
  borrowingsCurrent?: number | null;
  borrowingsNonCurrent?: number | null;
}

export interface NormalizedRatios {
  asOfDate: string;
  price: number;
  peRatio?: number | null;
  pbRatio?: number | null;
  roe?: number | null;
  roce?: number | null;
  dividendYield?: number | null;
  week52High?: number | null;
  week52Low?: number | null;
  marketCap?: number | null;
  sharesOutstanding?: number | null;
  bookValuePerShare?: number | null;
  eps?: number | null;
  financialsPeriodType?: string;
  financialsFiscalYear?: string;
}

export interface NormalizedTechnicalIndicators {
  tradeDate: string;
  close: number;
  sma20?: number | null;
  sma50?: number | null;
  sma200?: number | null;
  ema20?: number | null;
  rsi14?: number | null;
  macd?: number | null;
  macdSignal?: number | null;
  macdHistogram?: number | null;
  atr14?: number | null;
  relativeVolume?: number | null;
  trendSummary?: 'bullish' | 'bearish' | 'neutral';
}

export interface NormalizedCorporateAction {
  actionType: 'dividend' | 'bonus' | 'split' | 'rights' | 'buyback' | 'other' | string;
  subject: string;
  exDate: string;
  ratioFrom?: number | null;
  ratioTo?: number | null;
  source?: string;
}

export interface NormalizedShareholding {
  asOnDate: string;
  promoterPct: number;
  publicPct: number;
  employeeTrustPct?: number;
  fiiPct?: number;
  diiPct?: number;
  mutualFundsPct?: number;
  source?: string;
}

export interface NormalizedNewsItem {
  id: string;
  headline: string;
  publisher: string;
  publishedAt: string;
  url: string;
  symbol: string;
  summary: string;
  sentiment: 'positive' | 'neutral' | 'negative' | 'unknown';
  isAiGenerated: boolean;
}

export interface NormalizedMarketMover {
  symbol: string;
  companyName: string;
  tradeDate: string;
  close: number;
  prevClose: number;
  changePct: number;
  volume: number;
  category: 'gainers' | 'losers' | 'active';
}
