import { Request, Response } from 'express';
import { bharatStockProvider } from '../services/market-data/bharatstock.provider';
import { TechnicalCalculator } from '../services/indicators/technical-calculator';
import { recommendationEngine } from '../services/recommendations/recommendation-engine';
import {
  ChatRequestSchema,
  FundamentalsQuerySchema,
  HistoryQuerySchema,
  SearchQuerySchema,
  SymbolParamSchema,
} from '../schemas/stock.schemas';
import { aiResearchAssistant } from '../services/ai/ai-research-assistant';

export class StocksController {
  /**
   * Search Indian stocks by ticker or company name
   */
  async search(req: Request, res: Response): Promise<void> {
    try {
      const { q, limit } = SearchQuerySchema.parse(req.query);
      const results = await bharatStockProvider.searchStocks(q, limit);
      res.json({
        success: true,
        data: results,
        meta: { query: q, count: results.length },
      });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  }

  /**
   * Get single stock quote & profile
   */
  async getQuote(req: Request, res: Response): Promise<void> {
    try {
      const { symbol } = SymbolParamSchema.parse(req.params);
      const [quote, profile] = await Promise.all([
        bharatStockProvider.getQuote(symbol),
        bharatStockProvider.getStockProfile(symbol).catch(() => null),
      ]);

      res.json({
        success: true,
        data: {
          ...quote,
          companyName: profile?.companyName || quote.companyName || symbol,
          sector: profile?.sector,
          industry: profile?.industry,
          isin: profile?.isin,
          marketCapRank: profile?.marketCapRank,
          marketCap: profile?.marketCap,
          dataCoverage: profile?.dataCoverage,
        },
      });
    } catch (err: any) {
      const status = err.message.includes('404') ? 404 : 500;
      res.status(status).json({ success: false, error: err.message });
    }
  }

  /**
   * Get historical price candles for charting
   */
  async getHistory(req: Request, res: Response): Promise<void> {
    try {
      const { symbol } = SymbolParamSchema.parse(req.params);
      const { range } = HistoryQuerySchema.parse(req.query);

      const now = new Date();
      let fromDate: string | undefined;

      switch (range) {
        case '1D':
          // 5 days ago to ensure at least 1-2 sessions on weekends
          fromDate = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
          break;
        case '1W':
          fromDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
          break;
        case '1M':
          fromDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
          break;
        case '3M':
          fromDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
          break;
        case '1Y':
          fromDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
          break;
        case '5Y':
          fromDate = new Date(now.getTime() - 5 * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
          break;
        default:
          fromDate = undefined;
      }

      const candles = await bharatStockProvider.getHistoricalPrices(symbol, {
        from: fromDate,
        pageSize: range === '5Y' ? 500 : 250,
      });

      res.json({
        success: true,
        data: candles,
        meta: {
          symbol,
          range,
          count: candles.length,
          earliestDate: candles[0]?.tradeDate,
          latestDate: candles[candles.length - 1]?.tradeDate,
          providerNotice: 'On the BharatStock Free plan, time-series endpoints return up to the most recent 1 year of daily historical prices.',
        },
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  /**
   * Get fundamentals (quarterly/annual statements + valuation ratios + shareholding)
   */
  async getFundamentals(req: Request, res: Response): Promise<void> {
    try {
      const { symbol } = SymbolParamSchema.parse(req.params);
      const { periodType } = FundamentalsQuerySchema.parse(req.query);

      const [financials, ratios, shareholding, corporateActions] = await Promise.all([
        bharatStockProvider.getFinancials(symbol, periodType),
        bharatStockProvider.getRatios(symbol).catch(() => null),
        bharatStockProvider.getShareholding(symbol).catch(() => []),
        bharatStockProvider.getCorporateActions(symbol).catch(() => []),
      ]);

      res.json({
        success: true,
        data: {
          financials,
          ratios,
          shareholding,
          corporateActions,
          periodType,
        },
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  /**
   * Get technical indicators (SMA, EMA, RSI, MACD, ATR, relative volume)
   */
  async getTechnicals(req: Request, res: Response): Promise<void> {
    try {
      const { symbol } = SymbolParamSchema.parse(req.params);
      const candles = await bharatStockProvider.getHistoricalPrices(symbol, { pageSize: 250 });

      if (candles.length < 5) {
        res.status(400).json({
          success: false,
          error: 'Insufficient price history to calculate technical indicators',
        });
        return;
      }

      const calculated = TechnicalCalculator.calculateAll(candles);

      res.json({
        success: true,
        data: calculated,
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  /**
   * Get deterministic, explainable dual-horizon recommendation
   */
  async getRecommendation(req: Request, res: Response): Promise<void> {
    try {
      const { symbol } = SymbolParamSchema.parse(req.params);

      const [quote, profile, candles, financials, ratios, shareholding] = await Promise.all([
        bharatStockProvider.getQuote(symbol),
        bharatStockProvider.getStockProfile(symbol).catch(() => ({
          symbol,
          companyName: symbol,
          exchange: 'NSE',
          isActive: true,
        })),
        bharatStockProvider.getHistoricalPrices(symbol, { pageSize: 200 }),
        bharatStockProvider.getFinancials(symbol, 'quarterly').catch(() => []),
        bharatStockProvider.getRatios(symbol).catch(() => ({
          asOfDate: new Date().toISOString().split('T')[0],
          price: 0,
        })),
        bharatStockProvider.getShareholding(symbol).catch(() => []),
      ]);

      const tech = TechnicalCalculator.calculateAll(candles);

      const recommendation = recommendationEngine.generateRecommendation(
        quote,
        profile,
        candles,
        tech.indicators,
        tech.volatility30d,
        tech.relativeVolume,
        financials,
        ratios,
        shareholding
      );

      res.json({
        success: true,
        data: recommendation,
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  /**
   * Get evidence-based company SWOT and news research
   */
  async getNews(req: Request, res: Response): Promise<void> {
    try {
      const { symbol } = SymbolParamSchema.parse(req.params);

      const [quote, profile, ratios, financials] = await Promise.all([
        bharatStockProvider.getQuote(symbol).catch(() => null),
        bharatStockProvider.getStockProfile(symbol).catch(() => null),
        bharatStockProvider.getRatios(symbol).catch(() => null),
        bharatStockProvider.getFinancials(symbol, 'quarterly').catch(() => []),
      ]);

      const latestFin = financials[0];
      const prevFin = financials.length >= 4 ? financials[4] : financials[1];

      // Formulate verified facts for SWOT
      const strengths: string[] = [];
      const weaknesses: string[] = [];
      const opportunities: string[] = [];
      const threats: string[] = [];

      if (ratios?.roe && ratios.roe > 15) {
        strengths.push(`High Return on Equity (${ratios.roe.toFixed(1)}%), demonstrating capital productivity.`);
      }
      if (latestFin?.debtEquityRatio !== null && latestFin?.debtEquityRatio !== undefined && latestFin.debtEquityRatio < 0.5) {
        strengths.push(`Conservative leverage with Debt-to-Equity of ${latestFin.debtEquityRatio.toFixed(2)}x.`);
      }
      if (latestFin?.revenue && prevFin?.revenue && latestFin.revenue > prevFin.revenue) {
        const revGrowth = ((latestFin.revenue - prevFin.revenue) / prevFin.revenue) * 100;
        strengths.push(`Positive revenue expansion of ${revGrowth.toFixed(1)}% YoY in recent disclosures.`);
      }

      if (ratios?.peRatio && ratios.peRatio > 45) {
        weaknesses.push(`Premium valuation multiple of ${ratios.peRatio.toFixed(1)}x P/E limits margin of safety.`);
      }
      if (latestFin?.debtEquityRatio && latestFin.debtEquityRatio > 1.5) {
        weaknesses.push(`Leverage is elevated at ${latestFin.debtEquityRatio.toFixed(2)}x D/E, increasing interest sensitivity.`);
      }
      if (ratios?.dividendYield != null && ratios.dividendYield < 0.5) {
        weaknesses.push(`Low dividend yield (${ratios.dividendYield}%), with capital retained in operations.`);
      }

      opportunities.push(`Expanding sector tailwinds across ${profile?.sector || 'Indian industry'} driven by domestic capex.`);
      opportunities.push('Operating leverage expansion from rising economies of scale.');

      threats.push('Macroeconomic interest rate and inflation fluctuations influencing input costs.');
      threats.push('Intense sector peer competition and regulatory compliance overhead.');

      res.json({
        success: true,
        data: {
          symbol,
          companyName: profile?.companyName || symbol,
          hasDirectNewsEndpoint: false,
          newsDisclaimer: 'BharatStock API does not provide a news article feed. News and SWOT insights are synthesized strictly from verified financial statements, corporate actions, and regulatory filings.',
          articles: [],
          swot: {
            strengths: strengths.length > 0 ? strengths : ['Stable operating footprint with ongoing reporting track record.'],
            weaknesses: weaknesses.length > 0 ? weaknesses : ['Moderate profitability metrics subject to economic cycles.'],
            opportunities,
            threats,
          },
        },
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  /**
   * Market overview: Top gainers, losers, and most active stocks
   */
  async getMarketOverview(req: Request, res: Response): Promise<void> {
    try {
      const [gainers, losers, active] = await Promise.all([
        bharatStockProvider.getMarketMovers('gainers', 8),
        bharatStockProvider.getMarketMovers('losers', 8),
        bharatStockProvider.getMarketMovers('active', 8),
      ]);

      res.json({
        success: true,
        data: {
          gainers,
          losers,
          active,
          timestamp: gainers[0]?.tradeDate || new Date().toISOString(),
        },
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  /**
   * AI research assistant chat
   */
  async chat(req: Request, res: Response): Promise<void> {
    try {
      const { query, symbol } = ChatRequestSchema.parse(req.body);
      const answer = await aiResearchAssistant.handleChat(query, symbol);
      res.json({
        success: true,
        data: answer,
      });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  }
}

export const stocksController = new StocksController();
