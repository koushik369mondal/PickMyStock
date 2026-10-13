import {
  FinancialRatios,
  FinancialStatement,
  MarketOverview,
  PriceCandle,
  Shareholding,
  StockProfile,
  StockQuote,
  StockRecommendation,
  SwotResearch,
  TechnicalCalculationResult,
  ChatResponse,
} from '../types';

const API_BASE = (import.meta.env.VITE_API_URL as string) || '/api';

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const errorBody = await res.text();
    let message = `API request failed with status ${res.status}`;
    try {
      const parsed = JSON.parse(errorBody);
      if (parsed.error) message = parsed.error;
    } catch {
      // Use fallback
    }
    throw new Error(message);
  }
  const json = await res.json();
  return json.data !== undefined ? json.data : json;
}

export const api = {
  async searchStocks(query: string, limit = 10): Promise<StockProfile[]> {
    if (!query.trim()) return [];
    const res = await fetch(`${API_BASE}/stocks/search?q=${encodeURIComponent(query)}&limit=${limit}`);
    return handleResponse<StockProfile[]>(res);
  },

  async getQuote(symbol: string): Promise<StockQuote> {
    const res = await fetch(`${API_BASE}/stocks/${encodeURIComponent(symbol)}/quote`);
    return handleResponse<StockQuote>(res);
  },

  async getHistory(symbol: string, range = '1Y'): Promise<PriceCandle[]> {
    const res = await fetch(`${API_BASE}/stocks/${encodeURIComponent(symbol)}/history?range=${range}`);
    return handleResponse<PriceCandle[]>(res);
  },

  async getFundamentals(
    symbol: string,
    periodType: 'quarterly' | 'annual' = 'quarterly'
  ): Promise<{
    financials: FinancialStatement[];
    ratios: FinancialRatios | null;
    shareholding: Shareholding[];
    periodType: string;
  }> {
    const res = await fetch(
      `${API_BASE}/stocks/${encodeURIComponent(symbol)}/fundamentals?periodType=${periodType}`
    );
    return handleResponse(res);
  },

  async getTechnicals(symbol: string): Promise<TechnicalCalculationResult> {
    const res = await fetch(`${API_BASE}/stocks/${encodeURIComponent(symbol)}/technicals`);
    return handleResponse<TechnicalCalculationResult>(res);
  },

  async getRecommendation(symbol: string): Promise<StockRecommendation> {
    const res = await fetch(`${API_BASE}/stocks/${encodeURIComponent(symbol)}/recommendation`);
    return handleResponse<StockRecommendation>(res);
  },

  async getNews(symbol: string): Promise<SwotResearch> {
    const res = await fetch(`${API_BASE}/stocks/${encodeURIComponent(symbol)}/news`);
    return handleResponse<SwotResearch>(res);
  },

  async getMarketOverview(): Promise<MarketOverview> {
    const res = await fetch(`${API_BASE}/stocks/overview`);
    return handleResponse<MarketOverview>(res);
  },

  async getWatchlist(): Promise<Array<{ symbol: string; companyName: string; quote?: StockQuote }>> {
    const res = await fetch(`${API_BASE}/watchlist`);
    return handleResponse(res);
  },

  async addToWatchlist(symbol: string): Promise<void> {
    const res = await fetch(`${API_BASE}/watchlist`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ symbol }),
    });
    return handleResponse(res);
  },

  async removeFromWatchlist(symbol: string): Promise<void> {
    const res = await fetch(`${API_BASE}/watchlist/${encodeURIComponent(symbol)}`, {
      method: 'DELETE',
    });
    return handleResponse(res);
  },

  async chat(query: string, symbol: string): Promise<ChatResponse> {
    const res = await fetch(`${API_BASE}/agent/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, symbol }),
    });
    return handleResponse<ChatResponse>(res);
  },

  async getHealth(): Promise<{ status: string; config: any; provider: any }> {
    const res = await fetch(`${API_BASE}/health`);
    return res.json();
  },
};
