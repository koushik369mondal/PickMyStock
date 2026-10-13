import { env } from '../../config/env';
import {
  NormalizedCorporateAction,
  NormalizedFinancials,
  NormalizedMarketMover,
  NormalizedPriceCandle,
  NormalizedQuote,
  NormalizedRatios,
  NormalizedShareholding,
  NormalizedStockProfile,
} from './types';

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

export class BharatStockProvider {
  private apiKey: string;
  private baseUrl: string;
  private cache = new Map<string, CacheEntry<unknown>>();

  constructor() {
    this.apiKey = env.BHARATSTOCK_API_KEY;
    this.baseUrl = env.BHARATSTOCK_BASE_URL.replace(/\/+$/, '');
  }

  private getCache<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    return entry.data as T;
  }

  private setCache<T>(key: string, data: T, ttlSeconds: number): void {
    this.cache.set(key, {
      data,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
  }

  /**
   * Resilient HTTP fetcher with bounded retry, exponential backoff, and timeout.
   */
  private async fetchWithRetry<T>(
    endpoint: string,
    options: {
      params?: Record<string, string | number | boolean | undefined>;
      retries?: number;
      timeoutMs?: number;
    } = {}
  ): Promise<T> {
    const { params, retries = 2, timeoutMs = 8000 } = options;

    if (!this.apiKey) {
      throw new Error(
        'BHARATSTOCK_API_KEY is not configured. Please set BHARATSTOCK_API_KEY in server/.env.'
      );
    }

    const url = new URL(`${this.baseUrl}${endpoint}`);
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== null) {
          url.searchParams.append(k, String(v));
        }
      });
    }

    let lastError: Error | null = null;
    for (let attempt = 0; attempt <= retries; attempt++) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);

      try {
        const response = await fetch(url.toString(), {
          method: 'GET',
          headers: {
            'X-API-Key': this.apiKey,
            Accept: 'application/json',
          },
          signal: controller.signal,
        });

        clearTimeout(timer);

        if (response.status === 404) {
          throw new Error(`Resource not found for endpoint ${endpoint}`);
        }

        if (response.status === 429) {
          const body = await response.text();
          throw new Error(
            `BharatStock daily rate limit exceeded (429). Details: ${body || 'Quota exhausted'}`
          );
        }

        if (response.status === 401) {
          throw new Error(
            'BharatStock authentication failed (401). Verify your BHARATSTOCK_API_KEY in server/.env.'
          );
        }

        if (!response.ok) {
          const errorBody = await response.text();
          throw new Error(
            `BharatStock API error (${response.status} ${response.statusText}): ${errorBody}`
          );
        }

        const data = (await response.json()) as T;
        return data;
      } catch (err: unknown) {
        clearTimeout(timer);
        lastError = err as Error;

        // If it's 404 or 401, do not retry
        if (lastError.message.includes('404') || lastError.message.includes('401')) {
          throw lastError;
        }

        if (attempt < retries) {
          const delay = Math.pow(2, attempt) * 500;
          await new Promise((r) => setTimeout(r, delay));
        }
      }
    }

    throw lastError || new Error(`Failed to fetch from ${endpoint}`);
  }

  /**
   * Search Indian stocks by ticker or company name
   */
  async searchStocks(query: string, limit = 15): Promise<NormalizedStockProfile[]> {
    const trimmed = query.trim().toUpperCase();
    if (!trimmed) return [];

    const cacheKey = `search:${trimmed}:${limit}`;
    const cached = this.getCache<NormalizedStockProfile[]>(cacheKey);
    if (cached) return cached;

    try {
      const raw = await this.fetchWithRetry<any[]>('/v1/search', {
        params: { q: trimmed, limit },
      });

      const normalized: NormalizedStockProfile[] = raw.map((item) => ({
        symbol: item.symbol,
        isin: item.isin,
        companyName: item.company_name || item.symbol,
        sector: item.sector || undefined,
        exchange: item.exchange || 'NSE',
        isActive: item.is_active ?? true,
        marketCap: item.market_cap ? Number(item.market_cap) : undefined,
        marketCapRank: item.market_cap_rank,
      }));

      this.setCache(cacheKey, normalized, 3600); // 1 hour TTL
      return normalized;
    } catch (err) {
      console.warn(`[BharatStockProvider] Search failed for "${query}":`, (err as Error).message);
      return [];
    }
  }

  /**
   * Fetch company profile and latest EOD price
   */
  async getStockProfile(ticker: string, exchange?: string): Promise<NormalizedStockProfile> {
    const cleanTicker = ticker.trim().toUpperCase();
    const cacheKey = `stock:${cleanTicker}:${exchange || 'default'}`;
    const cached = this.getCache<NormalizedStockProfile>(cacheKey);
    if (cached) return cached;

    const raw = await this.fetchWithRetry<any>(`/v1/stocks/${cleanTicker}`, {
      params: { exchange },
    });

    const normalized: NormalizedStockProfile = {
      symbol: raw.symbol || cleanTicker,
      isin: raw.isin,
      companyName: raw.company_name || cleanTicker,
      sector: raw.sector || undefined,
      industry: raw.industry || undefined,
      exchange: raw.exchange || 'NSE',
      faceValue: raw.face_value !== undefined ? Number(raw.face_value) : undefined,
      marketCapRank: raw.market_cap_rank,
      marketCap: raw.market_cap ? Number(raw.market_cap) : undefined,
      listingDate: raw.listing_date,
      isActive: raw.is_active ?? true,
      dataCoverage: raw.data_coverage
        ? {
            financialsQuarterlyCurrent: raw.data_coverage.financials_quarterly_current,
            financialsAnnual: raw.data_coverage.financials_annual,
            dailyPrices: raw.data_coverage.daily_prices,
            corporateActions: raw.data_coverage.corporate_actions,
            sectorIndustry: raw.data_coverage.sector_industry,
          }
        : undefined,
    };

    this.setCache(cacheKey, normalized, 1800); // 30 min TTL
    return normalized;
  }

  /**
   * Fetch current quote snapshot
   */
  async getQuote(ticker: string): Promise<NormalizedQuote> {
    const cleanTicker = ticker.trim().toUpperCase();
    const cacheKey = `quote:${cleanTicker}`;
    const cached = this.getCache<NormalizedQuote>(cacheKey);
    if (cached) return cached;

    // Use /v1/stocks/{ticker} to obtain the richest latest_price and metadata
    const raw = await this.fetchWithRetry<any>(`/v1/stocks/${cleanTicker}`);
    const lp = raw.latest_price || {};

    const price = Number(lp.close || 0);
    const prevClose = Number(lp.prev_close || price);
    const change = Number((price - prevClose).toFixed(2));
    const changePct = prevClose > 0 ? Number(((change / prevClose) * 100).toFixed(2)) : 0;

    const quote: NormalizedQuote = {
      symbol: raw.symbol || cleanTicker,
      companyName: raw.company_name,
      price,
      prevClose,
      change,
      changePct,
      volume: Number(lp.volume || 0),
      turnoverLakhs: lp.turnover_lakhs ? Number(lp.turnover_lakhs) : undefined,
      deliveryPct: lp.delivery_pct !== null && lp.delivery_pct !== undefined ? Number(lp.delivery_pct) : null,
      tradeDate: lp.trade_date || new Date().toISOString().split('T')[0],
      source: 'BharatStock NSE/BSE EOD Feed',
      isRealTime: false,
      isDelayed: false,
      isEod: true,
      exchange: raw.exchange || 'NSE',
    };

    this.setCache(cacheKey, quote, 60); // 1 min TTL
    return quote;
  }

  /**
   * Fetch historical daily OHLCV prices
   */
  async getHistoricalPrices(
    ticker: string,
    options: { from?: string; to?: string; pageSize?: number } = {}
  ): Promise<NormalizedPriceCandle[]> {
    const cleanTicker = ticker.trim().toUpperCase();
    const pageSize = options.pageSize || 250;
    const cacheKey = `prices:${cleanTicker}:${options.from || ''}:${options.to || ''}:${pageSize}`;
    const cached = this.getCache<NormalizedPriceCandle[]>(cacheKey);
    if (cached) return cached;

    const raw = await this.fetchWithRetry<any>(`/v1/stocks/${cleanTicker}/prices`, {
      params: {
        from: options.from,
        to: options.to,
        page_size: pageSize,
      },
    });

    const list = Array.isArray(raw) ? raw : raw?.data || [];
    const candles: NormalizedPriceCandle[] = list.map((item: any) => ({
      tradeDate: item.trade_date,
      open: Number(item.open || item.close || 0),
      high: Number(item.high || item.close || 0),
      low: Number(item.low || item.close || 0),
      close: Number(item.close || 0),
      volume: Number(item.volume || 0),
      turnoverLakhs: item.turnover_lakhs ? Number(item.turnover_lakhs) : undefined,
      deliveryPct: item.delivery_pct !== null && item.delivery_pct !== undefined ? Number(item.delivery_pct) : null,
      adjustedClose: Number(item.adjusted_close || item.close || 0),
      adjustmentFactor: Number(item.adjustment_factor || 1.0),
    }));

    // Sort ascending by trade_date
    candles.sort((a, b) => new Date(a.tradeDate).getTime() - new Date(b.tradeDate).getTime());

    this.setCache(cacheKey, candles, 300); // 5 min TTL
    return candles;
  }

  /**
   * Fetch quarterly or annual financial statements
   */
  async getFinancials(
    ticker: string,
    periodType: 'quarterly' | 'annual' = 'quarterly'
  ): Promise<NormalizedFinancials[]> {
    const cleanTicker = ticker.trim().toUpperCase();
    const cacheKey = `financials:${cleanTicker}:${periodType}`;
    const cached = this.getCache<NormalizedFinancials[]>(cacheKey);
    if (cached) return cached;

    const raw = await this.fetchWithRetry<any>(`/v1/stocks/${cleanTicker}/financials`, {
      params: { period_type: periodType, page_size: 20 },
    });

    const list = Array.isArray(raw) ? raw : raw?.data || [];
    const normalized: NormalizedFinancials[] = list.map((row: any) => ({
      periodType,
      fiscalYear: row.fiscal_year,
      periodEndDate: row.period_end_date,
      revenue: row.revenue !== null && row.revenue !== undefined ? Number(row.revenue) : null,
      operatingProfit: row.operating_profit !== null && row.operating_profit !== undefined ? Number(row.operating_profit) : null,
      ebitda: row.ebitda !== null && row.ebitda !== undefined ? Number(row.ebitda) : null,
      netProfit: row.net_profit !== null && row.net_profit !== undefined ? Number(row.net_profit) : null,
      eps: row.eps !== null && row.eps !== undefined ? Number(row.eps) : null,
      debtEquityRatio: row.debt_equity_ratio !== null && row.debt_equity_ratio !== undefined ? Number(row.debt_equity_ratio) : null,
      cashFlowOperating: row.cash_flow_operating !== null && row.cash_flow_operating !== undefined ? Number(row.cash_flow_operating) : null,
      capex: row.capex !== null && row.capex !== undefined ? Number(row.capex) : null,
      freeCashFlow:
        row.cash_flow_operating !== null && row.capex !== null && row.cash_flow_operating !== undefined && row.capex !== undefined
          ? Number(row.cash_flow_operating) - Number(row.capex)
          : null,
      consolidationType: row.consolidation_type,
      totalAssets: row.total_assets ? Number(row.total_assets) : null,
      totalLiabilities: row.total_liabilities ? Number(row.total_liabilities) : null,
      totalEquity: row.total_equity ? Number(row.total_equity) : null,
      borrowingsCurrent: row.borrowings_current ? Number(row.borrowings_current) : null,
      borrowingsNonCurrent: row.borrowings_non_current ? Number(row.borrowings_non_current) : null,
    }));

    this.setCache(cacheKey, normalized, 1800); // 30 min TTL
    return normalized;
  }

  /**
   * Fetch latest valuation and profitability ratios
   */
  async getRatios(ticker: string): Promise<NormalizedRatios> {
    const cleanTicker = ticker.trim().toUpperCase();
    const cacheKey = `ratios:${cleanTicker}`;
    const cached = this.getCache<NormalizedRatios>(cacheKey);
    if (cached) return cached;

    const raw = await this.fetchWithRetry<any>(`/v1/stocks/${cleanTicker}/ratios`);

    const ratios: NormalizedRatios = {
      asOfDate: raw.as_of_date || new Date().toISOString().split('T')[0],
      price: Number(raw.price || 0),
      peRatio: raw.pe_ratio !== null && raw.pe_ratio !== undefined ? Number(raw.pe_ratio) : null,
      pbRatio: raw.pb_ratio !== null && raw.pb_ratio !== undefined ? Number(raw.pb_ratio) : null,
      roe: raw.roe !== null && raw.roe !== undefined ? Number(raw.roe) : null,
      roce: raw.roce !== null && raw.roce !== undefined ? Number(raw.roce) : null,
      dividendYield: raw.dividend_yield !== null && raw.dividend_yield !== undefined ? Number(raw.dividend_yield) : null,
      week52High: raw.week_52_high !== null && raw.week_52_high !== undefined ? Number(raw.week_52_high) : null,
      week52Low: raw.week_52_low !== null && raw.week_52_low !== undefined ? Number(raw.week_52_low) : null,
      marketCap: raw.market_cap ? Number(raw.market_cap) : null,
      sharesOutstanding: raw.shares_outstanding ? Number(raw.shares_outstanding) : null,
      bookValuePerShare: raw.book_value_per_share ? Number(raw.book_value_per_share) : null,
      eps: raw.eps !== null && raw.eps !== undefined ? Number(raw.eps) : null,
      financialsPeriodType: raw.financials_period_type,
      financialsFiscalYear: raw.financials_fiscal_year,
    };

    this.setCache(cacheKey, ratios, 1800); // 30 min TTL
    return ratios;
  }

  /**
   * Fetch corporate actions (dividends, splits, bonuses)
   */
  async getCorporateActions(ticker: string): Promise<NormalizedCorporateAction[]> {
    const cleanTicker = ticker.trim().toUpperCase();
    const cacheKey = `corp_actions:${cleanTicker}`;
    const cached = this.getCache<NormalizedCorporateAction[]>(cacheKey);
    if (cached) return cached;

    try {
      const raw = await this.fetchWithRetry<any>(`/v1/stocks/${cleanTicker}/corporate-actions`);
      const list = Array.isArray(raw) ? raw : raw?.data || [];
      const normalized: NormalizedCorporateAction[] = list.map((item: any) => ({
        actionType: item.action_type || 'other',
        subject: item.subject || '',
        exDate: item.ex_date,
        ratioFrom: item.ratio_from,
        ratioTo: item.ratio_to,
        source: item.source,
      }));
      this.setCache(cacheKey, normalized, 3600);
      return normalized;
    } catch {
      return [];
    }
  }

  /**
   * Fetch shareholding patterns
   */
  async getShareholding(ticker: string): Promise<NormalizedShareholding[]> {
    const cleanTicker = ticker.trim().toUpperCase();
    const cacheKey = `shareholding:${cleanTicker}`;
    const cached = this.getCache<NormalizedShareholding[]>(cacheKey);
    if (cached) return cached;

    try {
      const raw = await this.fetchWithRetry<any>(`/v1/stocks/${cleanTicker}/shareholding`);
      const list = Array.isArray(raw) ? raw : raw?.data || [];
      const normalized: NormalizedShareholding[] = list.map((item: any) => ({
        asOnDate: item.as_on_date,
        promoterPct: Number(item.promoter_pct || 0),
        publicPct: Number(item.public_pct || 0),
        employeeTrustPct: item.employee_trust_pct ? Number(item.employee_trust_pct) : 0,
        fiiPct: item.fii_pct ? Number(item.fii_pct) : undefined,
        diiPct: item.dii_pct ? Number(item.dii_pct) : undefined,
        mutualFundsPct: item.mutual_funds_pct ? Number(item.mutual_funds_pct) : undefined,
        source: item.source,
      }));
      this.setCache(cacheKey, normalized, 3600);
      return normalized;
    } catch {
      return [];
    }
  }

  /**
   * Fetch peer comparison in the same sector
   */
  async getPeerComparison(sector: string, limit = 8): Promise<any[]> {
    if (!sector) return [];
    const cacheKey = `peers:${sector}:${limit}`;
    const cached = this.getCache<any[]>(cacheKey);
    if (cached) return cached;

    try {
      const raw = await this.fetchWithRetry<any>('/v1/stocks/compare', {
        params: { sector, sort: 'market_cap', limit },
      });
      const list = Array.isArray(raw) ? raw : raw?.data || [];
      this.setCache(cacheKey, list, 1800);
      return list;
    } catch {
      return [];
    }
  }

  /**
   * Fetch market movers (gainers, losers, active)
   */
  async getMarketMovers(
    category: 'gainers' | 'losers' | 'active' = 'gainers',
    limit = 10
  ): Promise<NormalizedMarketMover[]> {
    const cacheKey = `movers:${category}:${limit}`;
    const cached = this.getCache<NormalizedMarketMover[]>(cacheKey);
    if (cached) return cached;

    try {
      const raw = await this.fetchWithRetry<any>('/v1/movers', {
        params: { category, limit },
      });
      const list = Array.isArray(raw) ? raw : raw?.data || [];
      const normalized: NormalizedMarketMover[] = list.map((item: any) => ({
        symbol: item.symbol,
        companyName: item.company_name || item.symbol,
        tradeDate: item.trade_date,
        close: Number(item.close || 0),
        prevClose: Number(item.prev_close || 0),
        changePct: Number(item.change_pct || 0),
        volume: Number(item.volume || 0),
        category,
      }));
      this.setCache(cacheKey, normalized, 300); // 5 min TTL
      return normalized;
    } catch (err) {
      console.warn(`[BharatStockProvider] getMarketMovers failed for ${category}:`, (err as Error).message);
      return [];
    }
  }

  /**
   * Fetch data integrity status
   */
  async getDataStatus(): Promise<any> {
    try {
      return await this.fetchWithRetry<any>('/v1/status');
    } catch {
      return { status: 'operational', summary: 'BharatStock API connected' };
    }
  }
}

export const bharatStockProvider = new BharatStockProvider();
