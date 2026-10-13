import React, { useEffect, useState } from 'react';
import {
  Bookmark,
  BookmarkCheck,
  TrendingUp,
  TrendingDown,
  Activity,
  Calendar,
  AlertTriangle,
  RefreshCw,
  Share2,
} from 'lucide-react';
import {
  FinancialRatios,
  FinancialStatement,
  PriceCandle,
  Shareholding,
  StockProfile,
  StockQuote,
  StockRecommendation,
  SwotResearch,
  TechnicalCalculationResult,
} from '../types';
import { api } from '../lib/api';
import { StockChart } from '../features/charts/StockChart';
import { RecommendationCard } from '../features/recommendations/RecommendationCard';
import { FinancialsTable } from '../features/stocks/FinancialsTable';
import { TechnicalTable } from '../features/stocks/TechnicalTable';
import { SwotSection } from '../features/stocks/SwotSection';
import { AiChatPanel } from '../features/assistant/AiChatPanel';

interface StockDetailPageProps {
  symbol: string;
}

export const StockDetailPage: React.FC<StockDetailPageProps> = ({ symbol }) => {
  const [quote, setQuote] = useState<StockQuote | null>(null);
  const [candles, setCandles] = useState<PriceCandle[]>([]);
  const [technicals, setTechnicals] = useState<TechnicalCalculationResult | null>(null);
  const [recommendation, setRecommendation] = useState<StockRecommendation | null>(null);
  const [financialsData, setFinancialsData] = useState<{
    financials: FinancialStatement[];
    ratios: FinancialRatios | null;
    shareholding: Shareholding[];
  }>({ financials: [], ratios: null, shareholding: [] });
  const [swotData, setSwotData] = useState<SwotResearch | null>(null);

  const [activeRange, setActiveRange] = useState<string>('1Y');
  const [periodType, setPeriodType] = useState<'quarterly' | 'annual'>('quarterly');
  const [isInWatchlist, setIsInWatchlist] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isChartLoading, setIsChartLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Load all initial stock data
  useEffect(() => {
    let isCancelled = false;

    async function fetchStockData() {
      setIsLoading(true);
      setErrorMessage(null);

      try {
        const [q, h, t, r, f, s, wl] = await Promise.all([
          api.getQuote(symbol),
          api.getHistory(symbol, activeRange),
          api.getTechnicals(symbol).catch(() => null),
          api.getRecommendation(symbol).catch(() => null),
          api.getFundamentals(symbol, periodType).catch(() => ({
            financials: [],
            ratios: null,
            shareholding: [],
            periodType,
          })),
          api.getNews(symbol).catch(() => null),
          api.getWatchlist().catch(() => []),
        ]);

        if (isCancelled) return;

        setQuote(q);
        setCandles(h);
        setTechnicals(t);
        setRecommendation(r);
        setFinancialsData({
          financials: f.financials || [],
          ratios: f.ratios || null,
          shareholding: f.shareholding || [],
        });
        setSwotData(s);
        setIsInWatchlist(wl.some((item) => item.symbol === symbol.toUpperCase()));
      } catch (err: any) {
        if (!isCancelled) {
          setErrorMessage(err.message || 'Failed to retrieve stock data.');
        }
      } finally {
        if (!isCancelled) setIsLoading(false);
      }
    }

    fetchStockData();

    return () => {
      isCancelled = true;
    };
  }, [symbol]);

  // Handle Chart Range Change
  const handleRangeChange = async (newRange: string) => {
    setActiveRange(newRange);
    setIsChartLoading(true);
    try {
      const history = await api.getHistory(symbol, newRange);
      setCandles(history);
    } catch (err) {
      console.warn('Failed to fetch range history:', err);
    } finally {
      setIsChartLoading(false);
    }
  };

  // Handle Period Type change (quarterly vs annual)
  const handlePeriodTypeChange = async (newPeriod: 'quarterly' | 'annual') => {
    setPeriodType(newPeriod);
    try {
      const fund = await api.getFundamentals(symbol, newPeriod);
      setFinancialsData((prev) => ({
        ...prev,
        financials: fund.financials || [],
      }));
    } catch (err) {
      console.warn('Failed to switch period type:', err);
    }
  };

  // Watchlist toggle
  const handleToggleWatchlist = async () => {
    try {
      if (isInWatchlist) {
        await api.removeFromWatchlist(symbol);
        setIsInWatchlist(false);
      } else {
        await api.addToWatchlist(symbol);
        setIsInWatchlist(true);
      }
    } catch (err) {
      console.warn('Watchlist toggle error:', err);
    }
  };

  if (isLoading) {
    return (
      <div className="py-24 text-center">
        <div className="w-8 h-8 border-2 border-orange-200 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <h2 className="text-base font-medium text-white font-['Montserrat']">
          Fetching official NSE/BSE disclosures for {symbol}...
        </h2>
        <p className="text-xs text-neutral-500 mt-1 font-mono">
          Evaluating deterministic financial health and technical momentum
        </p>
      </div>
    );
  }

  if (errorMessage || !quote) {
    return (
      <div className="card-chai p-8 rounded-xl border border-rose-900/30 bg-rose-950/10 text-center max-w-lg mx-auto my-16">
        <AlertTriangle className="w-8 h-8 text-rose-400 mx-auto mb-3" />
        <h2 className="text-lg font-semibold text-white font-['Montserrat']">
          Unable to Load {symbol}
        </h2>
        <p className="text-xs text-neutral-300 mt-2 mb-4 leading-relaxed">
          {errorMessage || 'The specified stock symbol could not be located in official Indian exchange records.'}
        </p>
        <button
          onClick={() => window.location.reload()}
          className="btn-asym-solid px-4 py-2 bg-white text-black text-xs font-semibold hover:bg-neutral-200 transition-colors cursor-pointer"
        >
          Try Again
        </button>
      </div>
    );
  }

  const isPositive = quote.change >= 0;

  return (
    <div className="space-y-8 py-6 text-left">
      {/* 1. Stock Header Bar */}
      <div className="flex flex-wrap items-start justify-between gap-4 pb-6 border-b border-orange-50/10">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-2xl sm:text-3xl font-bold font-mono text-white tracking-tight">
              {quote.symbol}
            </span>
            <span className="text-xs px-2 py-0.5 rounded border border-neutral-700 text-neutral-300 font-mono">
              {quote.exchange || 'NSE'}
            </span>
            {quote.sector && (
              <span className="text-xs px-2 py-0.5 rounded bg-neutral-900 border border-orange-50/10 text-neutral-400">
                {quote.sector}
              </span>
            )}
            {quote.marketCapRank && (
              <span className="text-xs text-neutral-500 font-mono">
                #{quote.marketCapRank} in India
              </span>
            )}
          </div>

          <h2 className="text-base text-neutral-400 font-normal">
            {quote.companyName || quote.symbol}
          </h2>

          <div className="flex items-center gap-3 text-xs text-neutral-500 mt-2 font-mono">
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" /> As of {quote.tradeDate}
            </span>
            <span>·</span>
            <span>End-of-day Close</span>
            <span>·</span>
            <span className="text-emerald-400/90">Verified Feed</span>
          </div>
        </div>

        {/* Price & Watchlist CTA */}
        <div className="flex flex-col sm:items-end gap-3">
          <div className="sm:text-right">
            <div className="text-3xl font-bold font-mono text-white">
              ₹{quote.price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
            <div
              className={`text-sm font-mono font-medium flex items-center sm:justify-end gap-1.5 mt-0.5 ${
                isPositive ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {isPositive ? (
                <TrendingUp className="w-4 h-4" />
              ) : (
                <TrendingDown className="w-4 h-4" />
              )}
              <span>
                {isPositive ? '+' : ''}
                {quote.change.toFixed(2)} ({isPositive ? '+' : ''}
                {quote.changePct.toFixed(2)}%)
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleToggleWatchlist}
              className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                isInWatchlist
                  ? 'border-amber-400/50 text-amber-300 bg-amber-950/20'
                  : 'border-orange-50/20 text-white hover:bg-neutral-900'
              }`}
            >
              {isInWatchlist ? (
                <>
                  <BookmarkCheck className="w-3.5 h-3.5 text-amber-300" />
                  <span>Saved in Watchlist</span>
                </>
              ) : (
                <>
                  <Bookmark className="w-3.5 h-3.5 text-neutral-400" />
                  <span>Add to Watchlist</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* 2. Dual-Horizon Recommendation Cards */}
      {recommendation && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-white font-['Montserrat']">
                Deterministic Research Signal
              </h2>
              <p className="text-xs text-neutral-400">
                Independent heuristic scores (0–100) with supporting factor evidence and risk disclosure
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <RecommendationCard
              recommendation={recommendation.shortTerm}
              symbol={quote.symbol}
            />
            <RecommendationCard
              recommendation={recommendation.longTerm}
              symbol={quote.symbol}
            />
          </div>
        </div>
      )}

      {/* 3. Interactive Historical Price Chart */}
      <StockChart
        candles={candles}
        symbol={quote.symbol}
        activeRange={activeRange}
        onRangeChange={handleRangeChange}
        isLoading={isChartLoading}
      />

      {/* 4. Technical Indicators Breakdown */}
      <TechnicalTable technicals={technicals} symbol={quote.symbol} />

      {/* 5. Financial Statements & Key Ratios */}
      <FinancialsTable
        financials={financialsData.financials}
        ratios={financialsData.ratios}
        shareholding={financialsData.shareholding}
        periodType={periodType}
        onPeriodTypeChange={handlePeriodTypeChange}
      />

      {/* 6. Strategic SWOT & Verified Facts */}
      <SwotSection swotData={swotData} symbol={quote.symbol} />

      {/* 7. AI Stock Research Assistant Panel */}
      <div className="pt-2">
        <AiChatPanel symbol={quote.symbol} />
      </div>
    </div>
  );
};
