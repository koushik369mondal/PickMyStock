export interface StockProfile {
  symbol: string;
  isin?: string;
  companyName: string;
  sector?: string;
  industry?: string;
  exchange: string;
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

export interface StockQuote {
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
  sector?: string;
  industry?: string;
  marketCapRank?: number;
}

export interface PriceCandle {
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

export interface FactorEvidence {
  id: string;
  name: string;
  weight: number;
  score: number;
  value: string | number | null;
  calculation: string;
  interpretation: string;
  source: string;
  status: 'positive' | 'negative' | 'neutral' | 'missing';
}

export interface HorizonRecommendation {
  horizon: 'short_term' | 'long_term';
  score: number;
  classification: 'favorable' | 'neutral' | 'unfavorable' | 'insufficient_data';
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

export interface StockRecommendation {
  symbol: string;
  companyName: string;
  price: number;
  dataTimestamp: string;
  shortTerm: HorizonRecommendation;
  longTerm: HorizonRecommendation;
  overallSummary: string;
  disclaimer: string;
}

export interface FinancialStatement {
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
}

export interface FinancialRatios {
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
}

export interface Shareholding {
  asOnDate: string;
  promoterPct: number;
  publicPct: number;
  employeeTrustPct?: number;
}

export interface TechnicalIndicators {
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

export interface TechnicalCalculationResult {
  indicators: TechnicalIndicators;
  history: TechnicalIndicators[];
  trend: 'bullish' | 'bearish' | 'neutral';
  volatility30d: number;
  relativeVolume: number;
}

export interface MarketMover {
  symbol: string;
  companyName: string;
  tradeDate: string;
  close: number;
  prevClose: number;
  changePct: number;
  volume: number;
  category: 'gainers' | 'losers' | 'active';
}

export interface MarketOverview {
  gainers: MarketMover[];
  losers: MarketMover[];
  active: MarketMover[];
  timestamp: string;
}

export interface SwotResearch {
  symbol: string;
  companyName: string;
  hasDirectNewsEndpoint: boolean;
  newsDisclaimer: string;
  articles: Array<{
    id: string;
    headline: string;
    publisher: string;
    publishedAt: string;
    url: string;
    summary: string;
  }>;
  swot: {
    strengths: string[];
    weaknesses: string[];
    opportunities: string[];
    threats: string[];
  };
}

export interface ChatResponse {
  message: string;
  toolsUsed: string[];
  symbol?: string;
  isAiEnabled: boolean;
  provider: string;
}
