import React, { useEffect, useState } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Activity,
  ArrowUpRight,
  ShieldCheck,
  Search,
  Bookmark,
  Sparkles,
  Zap,
} from 'lucide-react';
import { MarketOverview, StockProfile } from '../types';
import { api } from '../lib/api';

interface DashboardPageProps {
  onSelectStock: (symbol: string) => void;
  onNavigateToWatchlist: () => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  onSelectStock,
  onNavigateToWatchlist,
}) => {
  const [overview, setOverview] = useState<MarketOverview | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [watchlistSummary, setWatchlistSummary] = useState<any[]>([]);

  const benchmarkSymbols = [
    { symbol: 'RELIANCE', name: 'Reliance Industries', sector: 'Energy' },
    { symbol: 'TCS', name: 'Tata Consultancy Services', sector: 'IT' },
    { symbol: 'HDFCBANK', name: 'HDFC Bank', sector: 'Banking' },
    { symbol: 'INFY', name: 'Infosys', sector: 'IT' },
    { symbol: 'ITC', name: 'ITC Limited', sector: 'FMCG' },
    { symbol: 'BHARTIARTL', name: 'Bharti Airtel', sector: 'Telecom' },
  ];

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const [ovData, wlData] = await Promise.all([
          api.getMarketOverview().catch(() => null),
          api.getWatchlist().catch(() => []),
        ]);
        if (ovData) setOverview(ovData);
        setWatchlistSummary(wlData);
      } catch (err) {
        console.warn('Dashboard load error:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  return (
    <div className="space-y-10 py-6">
      {/* Hero Section */}
      <div className="relative text-left max-w-5xl 2xl:max-w-6xl pt-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-orange-50/15 bg-neutral-900/60 text-xs text-neutral-300 font-mono mb-4">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          <span>NSE & BSE Quantitative Decision Support</span>
        </div>

        <h1 className="text-[38px] md:text-5xl lg:text-6xl font-semibold tracking-tight text-white leading-tight font-['Manrope']">
          Research Indian stocks with{' '}
          <span className="highlight-phrase">explainable evidence</span>.
        </h1>

        <p className="mt-4 text-base md:text-lg text-neutral-400 max-w-3xl xl:max-w-4xl leading-relaxed">
          PickMyStock delivers deterministic, dual-horizon evaluation for Indian equities. Every short-term momentum and long-term fundamental recommendation identifies supporting data, key balance-sheet drivers, and critical risks.
        </p>

        {/* Action Buttons adhering to ChaiUI rules: one Solid, one Outline with mirrored corners */}
        <div className="mt-8 flex flex-wrap items-center gap-3">
          <button
            onClick={() => onSelectStock('RELIANCE')}
            className="btn-asym-solid px-5 py-2.5 bg-white text-black text-sm font-semibold hover:bg-neutral-200 transition-colors cursor-pointer flex items-center gap-2"
          >
            <span>Research Reliance Industries</span>
            <ArrowUpRight className="w-4 h-4" />
          </button>
          <button
            onClick={onNavigateToWatchlist}
            className="btn-asym-outline px-5 py-2.5 border border-orange-50/20 text-white text-sm font-medium hover:bg-neutral-900 transition-colors cursor-pointer flex items-center gap-2"
          >
            <Bookmark className="w-4 h-4 text-neutral-400" />
            <span>Open Saved Watchlist</span>
          </button>
        </div>
      </div>

      {/* Benchmark Ticker Chips */}
      <div>
        <div className="text-xs uppercase tracking-wider text-neutral-500 font-mono mb-3">
          Popular Benchmark Equities
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3.5 xl:gap-4">
          {benchmarkSymbols.map((s) => (
            <button
              key={s.symbol}
              onClick={() => onSelectStock(s.symbol)}
              className="card-chai p-3.5 sm:p-4 rounded-xl border border-orange-50/15 bg-black/10 text-left hover:border-orange-50/30 transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold text-white font-mono text-sm group-hover:text-amber-100 transition-colors">
                  {s.symbol}
                </span>
                <span className="text-[10px] text-neutral-500">{s.sector}</span>
              </div>
              <div className="text-xs text-neutral-400 truncate">{s.name}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Market Movers Overview (Gainers / Losers / Active) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-white font-['Montserrat']">
              Market Movers Overview
            </h2>
            <p className="text-xs text-neutral-400">
              Verified top price movers and volume leaders from latest trading session
            </p>
          </div>
          {overview?.timestamp && (
            <span className="text-xs text-neutral-500 font-mono">
              Session: {overview.timestamp}
            </span>
          )}
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="card-chai p-4 rounded-xl border border-orange-50/15 bg-neutral-900/40 h-64 animate-pulse"
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 xl:gap-6">
            {/* Top Gainers */}
            <div className="card-chai p-4 sm:p-5 rounded-xl border border-orange-50/15 bg-black/10 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 mb-3 font-mono">
                  <TrendingUp className="w-4 h-4" />
                  Top Session Gainers
                </div>
                <div className="space-y-2">
                  {overview?.gainers && overview.gainers.length > 0 ? (
                    overview.gainers.slice(0, 5).map((m) => (
                      <button
                        key={m.symbol}
                        onClick={() => onSelectStock(m.symbol)}
                        className="w-full p-2.5 sm:p-3 rounded-lg bg-neutral-900/60 hover:bg-neutral-800/80 transition-colors text-left flex items-center justify-between cursor-pointer group"
                      >
                        <div>
                          <div className="font-semibold text-xs text-white font-mono group-hover:text-amber-100">
                            {m.symbol}
                          </div>
                          <div className="text-[11px] text-neutral-400 truncate max-w-[180px] sm:max-w-[240px] xl:max-w-[280px] 2xl:max-w-[340px]">
                            {m.companyName}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs font-mono text-white">₹{m.close}</div>
                          <div className="text-[11px] font-mono text-emerald-400 font-medium">
                            +{m.changePct.toFixed(2)}%
                          </div>
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className="text-xs text-neutral-500 py-4 text-center">
                      Session gainers feed loading...
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Top Losers */}
            <div className="card-chai p-4 sm:p-5 rounded-xl border border-orange-50/15 bg-black/10 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 text-xs font-semibold text-rose-400 mb-3 font-mono">
                  <TrendingDown className="w-4 h-4" />
                  Top Session Decliners
                </div>
                <div className="space-y-2">
                  {overview?.losers && overview.losers.length > 0 ? (
                    overview.losers.slice(0, 5).map((m) => (
                      <button
                        key={m.symbol}
                        onClick={() => onSelectStock(m.symbol)}
                        className="w-full p-2.5 sm:p-3 rounded-lg bg-neutral-900/60 hover:bg-neutral-800/80 transition-colors text-left flex items-center justify-between cursor-pointer group"
                      >
                        <div>
                          <div className="font-semibold text-xs text-white font-mono group-hover:text-amber-100">
                            {m.symbol}
                          </div>
                          <div className="text-[11px] text-neutral-400 truncate max-w-[180px] sm:max-w-[240px] xl:max-w-[280px] 2xl:max-w-[340px]">
                            {m.companyName}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs font-mono text-white">₹{m.close}</div>
                          <div className="text-[11px] font-mono text-rose-400 font-medium">
                            {m.changePct.toFixed(2)}%
                          </div>
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className="text-xs text-neutral-500 py-4 text-center">
                      Session decliners feed loading...
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Most Active by Volume */}
            <div className="card-chai p-4 sm:p-5 rounded-xl border border-orange-50/15 bg-black/10 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 text-xs font-semibold text-blue-400 mb-3 font-mono">
                  <Activity className="w-4 h-4" />
                  Most Active by Volume
                </div>
                <div className="space-y-2">
                  {overview?.active && overview.active.length > 0 ? (
                    overview.active.slice(0, 5).map((m) => (
                      <button
                        key={m.symbol}
                        onClick={() => onSelectStock(m.symbol)}
                        className="w-full p-2.5 sm:p-3 rounded-lg bg-neutral-900/60 hover:bg-neutral-800/80 transition-colors text-left flex items-center justify-between cursor-pointer group"
                      >
                        <div>
                          <div className="font-semibold text-xs text-white font-mono group-hover:text-amber-100">
                            {m.symbol}
                          </div>
                          <div className="text-[11px] text-neutral-400 truncate max-w-[180px] sm:max-w-[240px] xl:max-w-[280px] 2xl:max-w-[340px]">
                            {m.companyName}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs font-mono text-white">₹{m.close}</div>
                          <div className="text-[11px] font-mono text-neutral-400">
                            {(m.volume / 1e5).toFixed(1)}L Vol
                          </div>
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className="text-xs text-neutral-500 py-4 text-center">
                      Volume leaders feed loading...
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Platform Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 xl:gap-6 pt-4">
        <div className="card-chai p-5 sm:p-6 rounded-xl border border-orange-50/15 bg-black/10">
          <div className="w-8 h-8 rounded-lg bg-neutral-900 border border-orange-50/15 flex items-center justify-center text-white mb-3">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <h3 className="text-sm font-semibold text-white font-['Montserrat'] mb-1">
            Deterministic Heuristics
          </h3>
          <p className="text-xs text-neutral-400 leading-relaxed">
            Short-term and long-term recommendations are calculated by transparent, deterministic formulas. No hallucinated target prices or black-box predictions.
          </p>
        </div>

        <div className="card-chai p-5 sm:p-6 rounded-xl border border-orange-50/15 bg-black/10">
          <div className="w-8 h-8 rounded-lg bg-neutral-900 border border-orange-50/15 flex items-center justify-center text-white mb-3">
            <Zap className="w-4 h-4 text-amber-300" />
          </div>
          <h3 className="text-sm font-semibold text-white font-['Montserrat'] mb-1">
            Official Regulatory Filings
          </h3>
          <p className="text-xs text-neutral-400 leading-relaxed">
            Financials, shareholding, and corporate actions directly map to official NSE and BSE disclosures without web-scraping or unverified sources.
          </p>
        </div>

        <div className="card-chai p-5 sm:p-6 rounded-xl border border-orange-50/15 bg-black/10">
          <div className="w-8 h-8 rounded-lg bg-neutral-900 border border-orange-50/15 flex items-center justify-center text-white mb-3">
            <Sparkles className="w-4 h-4 text-orange-200" />
          </div>
          <h3 className="text-sm font-semibold text-white font-['Montserrat'] mb-1">
            Grounded AI Assistant
          </h3>
          <p className="text-xs text-neutral-400 leading-relaxed">
            Inquire about earnings changes, balance-sheet risks, or valuation multiples using an extensible read-only tool-calling interface.
          </p>
        </div>
      </div>
    </div>
  );
};
