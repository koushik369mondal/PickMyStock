import React from 'react';
import { TechnicalCalculationResult } from '../../types';

interface TechnicalTableProps {
  technicals: TechnicalCalculationResult | null;
  symbol: string;
}

export const TechnicalTable: React.FC<TechnicalTableProps> = ({ technicals, symbol }) => {
  if (!technicals) return null;

  const { indicators, trend, volatility30d, relativeVolume } = technicals;

  const getRsiColor = (rsi?: number | null) => {
    if (!rsi) return 'text-neutral-400';
    if (rsi > 70) return 'text-amber-400';
    if (rsi < 30) return 'text-rose-400';
    return 'text-emerald-400';
  };

  const getTrendBadge = () => {
    switch (trend) {
      case 'bullish':
        return 'border border-emerald-500/40 text-emerald-400 bg-emerald-950/20';
      case 'bearish':
        return 'border border-rose-500/40 text-rose-400 bg-rose-950/20';
      case 'neutral':
      default:
        return 'border border-neutral-700 text-neutral-400 bg-neutral-900';
    }
  };

  return (
    <div className="card-chai rounded-xl p-5 border border-orange-50/15 bg-black/10 backdrop-blur-sm">
      <div className="flex items-center justify-between gap-3 mb-4">
        <div>
          <h3 className="text-base font-semibold text-white font-['Montserrat']">
            Technical Indicators & Price Momentum
          </h3>
          <p className="text-xs text-neutral-400">
            Calculated from validated daily exchange session history
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`px-2.5 py-1 rounded text-xs font-medium font-mono ${getTrendBadge()}`}>
            Trend: {trend.toUpperCase()}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        <div className="p-3 rounded-lg bg-neutral-900/60 border border-neutral-800">
          <div className="text-[11px] text-neutral-400 font-mono">SMA 20-Day</div>
          <div className="text-lg font-semibold font-mono text-white mt-1">
            {indicators.sma20 ? `₹${indicators.sma20.toFixed(2)}` : '—'}
          </div>
          <div className="text-[10px] text-neutral-500 mt-1">Short-term trend baseline</div>
        </div>

        <div className="p-3 rounded-lg bg-neutral-900/60 border border-neutral-800">
          <div className="text-[11px] text-neutral-400 font-mono">SMA 50-Day</div>
          <div className="text-lg font-semibold font-mono text-white mt-1">
            {indicators.sma50 ? `₹${indicators.sma50.toFixed(2)}` : '—'}
          </div>
          <div className="text-[10px] text-neutral-500 mt-1">Medium-term trend support</div>
        </div>

        <div className="p-3 rounded-lg bg-neutral-900/60 border border-neutral-800">
          <div className="text-[11px] text-neutral-400 font-mono">SMA 200-Day</div>
          <div className="text-lg font-semibold font-mono text-white mt-1">
            {indicators.sma200 ? `₹${indicators.sma200.toFixed(2)}` : '—'}
          </div>
          <div className="text-[10px] text-neutral-500 mt-1">Long-term institutional anchor</div>
        </div>

        <div className="p-3 rounded-lg bg-neutral-900/60 border border-neutral-800">
          <div className="text-[11px] text-neutral-400 font-mono">RSI (14) Momentum</div>
          <div className={`text-lg font-semibold font-mono mt-1 ${getRsiColor(indicators.rsi14)}`}>
            {indicators.rsi14 ? `${indicators.rsi14.toFixed(1)}` : '—'}
          </div>
          <div className="text-[10px] text-neutral-500 mt-1">
            {indicators.rsi14 && indicators.rsi14 > 70
              ? 'Overbought territory'
              : indicators.rsi14 && indicators.rsi14 < 30
                ? 'Oversold territory'
                : 'Balanced expansion zone'}
          </div>
        </div>

        <div className="p-3 rounded-lg bg-neutral-900/60 border border-neutral-800">
          <div className="text-[11px] text-neutral-400 font-mono">MACD (12, 26, 9)</div>
          <div className="text-lg font-semibold font-mono text-white mt-1">
            {indicators.macd !== null && indicators.macd !== undefined ? indicators.macd.toFixed(2) : '—'}
          </div>
          <div className="text-[10px] text-neutral-500 mt-1">
            Signal: {indicators.macdSignal ?? '—'} · Hist: {indicators.macdHistogram ?? '—'}
          </div>
        </div>

        <div className="p-3 rounded-lg bg-neutral-900/60 border border-neutral-800">
          <div className="text-[11px] text-neutral-400 font-mono">Relative Volume (RVol)</div>
          <div className="text-lg font-semibold font-mono text-white mt-1">
            {relativeVolume ? `${relativeVolume.toFixed(2)}x` : '—'}
          </div>
          <div className="text-[10px] text-neutral-500 mt-1">Current vs 20-session average</div>
        </div>

        <div className="p-3 rounded-lg bg-neutral-900/60 border border-neutral-800">
          <div className="text-[11px] text-neutral-400 font-mono">Average True Range (ATR 14)</div>
          <div className="text-lg font-semibold font-mono text-white mt-1">
            {indicators.atr14 ? `₹${indicators.atr14.toFixed(2)}` : '—'}
          </div>
          <div className="text-[10px] text-neutral-500 mt-1">Typical daily rupee price excursion</div>
        </div>

        <div className="p-3 rounded-lg bg-neutral-900/60 border border-neutral-800">
          <div className="text-[11px] text-neutral-400 font-mono">30-Day Volatility</div>
          <div className="text-lg font-semibold font-mono text-white mt-1">
            {volatility30d ? `${volatility30d.toFixed(1)}%` : '—'}
          </div>
          <div className="text-[10px] text-neutral-500 mt-1">Annualized daily volatility</div>
        </div>
      </div>
    </div>
  );
};
