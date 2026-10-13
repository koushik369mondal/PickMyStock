import React from 'react';
import { Shield, Scale, Database, AlertCircle, CheckCircle, Info } from 'lucide-react';

export const MethodologyPage: React.FC = () => {
  return (
    <div className="space-y-10 py-6 text-left max-w-5xl 2xl:max-w-6xl mx-auto">
      {/* Header */}
      <div className="pb-4 border-b border-orange-50/10">
        <div className="inline-flex items-center gap-1.5 text-xs text-neutral-400 font-mono mb-1">
          <Scale className="w-3.5 h-3.5 text-amber-300" />
          <span>Transparent Quantitative Architecture</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-semibold text-white font-['Montserrat']">
          Research Methodology & Scoring Formulas
        </h1>
        <p className="text-sm text-neutral-400 mt-2 leading-relaxed">
          PickMyStock generates dual-horizon signals strictly through deterministic, evidence-backed formulas. We never rely on generative language models to invent scores or fabricate target prices.
        </p>
      </div>

      {/* 1. Short-Term Methodology */}
      <div className="card-chai p-6 rounded-xl border border-orange-50/15 bg-black/10">
        <div className="flex items-center gap-2 mb-2 text-sm font-semibold text-white font-['Montserrat']">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          Short-Term Momentum Score (1–20 Trading Days)
        </div>
        <p className="text-xs text-neutral-400 mb-5 leading-relaxed">
          The short-term score evaluates technical continuation, volume support, and volatility containment from validated session closes.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3 rounded-lg bg-neutral-900/60 border border-neutral-800">
            <div className="flex justify-between font-mono font-medium text-white mb-1">
              <span>Price Momentum</span>
              <span className="text-amber-200">30% Weight</span>
            </div>
            <p className="text-neutral-400 text-[11px] leading-relaxed">
              Measures percentage rate-of-change across 5-day and 20-day trailing windows to identify directional pressure.
            </p>
          </div>

          <div className="p-3 rounded-lg bg-neutral-900/60 border border-neutral-800">
            <div className="flex justify-between font-mono font-medium text-white mb-1">
              <span>Trend Strength</span>
              <span className="text-amber-200">25% Weight</span>
            </div>
            <p className="text-neutral-400 text-[11px] leading-relaxed">
              Price positioning relative to the 20-day SMA, 50-day SMA, and 20-day exponential moving average (EMA).
            </p>
          </div>

          <div className="p-3 rounded-lg bg-neutral-900/60 border border-neutral-800">
            <div className="flex justify-between font-mono font-medium text-white mb-1">
              <span>RSI Momentum</span>
              <span className="text-amber-200">15% Weight</span>
            </div>
            <p className="text-neutral-400 text-[11px] leading-relaxed">
              Wilder's 14-period RSI assessment; favors the 50–68 continuation zone while penalizing severe overbought or oversold exhaustion.
            </p>
          </div>

          <div className="p-3 rounded-lg bg-neutral-900/60 border border-neutral-800">
            <div className="flex justify-between font-mono font-medium text-white mb-1">
              <span>Relative Volume</span>
              <span className="text-amber-200">15% Weight</span>
            </div>
            <p className="text-neutral-400 text-[11px] leading-relaxed">
              Current session volume divided by 20-day average volume to validate institutional participation vs distribution.
            </p>
          </div>

          <div className="p-3 rounded-lg bg-neutral-900/60 border border-neutral-800 sm:col-span-2">
            <div className="flex justify-between font-mono font-medium text-white mb-1">
              <span>Volatility & Downside Risk</span>
              <span className="text-amber-200">15% Weight</span>
            </div>
            <p className="text-neutral-400 text-[11px] leading-relaxed">
              30-day annualized log-return volatility. Penalizes unpredictable wide excursions that threaten short-term capital protection.
            </p>
          </div>
        </div>
      </div>

      {/* 2. Long-Term Methodology */}
      <div className="card-chai p-6 rounded-xl border border-orange-50/15 bg-black/10">
        <div className="flex items-center gap-2 mb-2 text-sm font-semibold text-white font-['Montserrat']">
          <span className="w-2 h-2 rounded-full bg-blue-400" />
          Long-Term Fundamental Score (1–3 Years & Beyond)
        </div>
        <p className="text-xs text-neutral-400 mb-5 leading-relaxed">
          The long-term score analyzes compounding power, capital productivity, balance sheet durability, and valuation margin of safety from official regulatory filings.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3 rounded-lg bg-neutral-900/60 border border-neutral-800">
            <div className="flex justify-between font-mono font-medium text-white mb-1">
              <span>Revenue & Profit Growth</span>
              <span className="text-amber-200">25% Weight</span>
            </div>
            <p className="text-neutral-400 text-[11px] leading-relaxed">
              Year-over-year expansion in net sales and profit after tax (PAT) across matching reporting cycles.
            </p>
          </div>

          <div className="p-3 rounded-lg bg-neutral-900/60 border border-neutral-800">
            <div className="flex justify-between font-mono font-medium text-white mb-1">
              <span>Financial Health & Cash Flow</span>
              <span className="text-amber-200">25% Weight</span>
            </div>
            <p className="text-neutral-400 text-[11px] leading-relaxed">
              Debt-to-equity ratio, operating cash flow (CFO), and free cash flow generation capacity.
            </p>
          </div>

          <div className="p-3 rounded-lg bg-neutral-900/60 border border-neutral-800">
            <div className="flex justify-between font-mono font-medium text-white mb-1">
              <span>Valuation Multiples</span>
              <span className="text-amber-200">25% Weight</span>
            </div>
            <p className="text-neutral-400 text-[11px] leading-relaxed">
              Trailing P/E and P/B multiples relative to earnings power, assessing whether positive expectations are already priced in.
            </p>
          </div>

          <div className="p-3 rounded-lg bg-neutral-900/60 border border-neutral-800">
            <div className="flex justify-between font-mono font-medium text-white mb-1">
              <span>Capital Efficiency (ROE & ROCE)</span>
              <span className="text-amber-200">15% Weight</span>
            </div>
            <p className="text-neutral-400 text-[11px] leading-relaxed">
              Return on equity and capital employed to confirm durable management capital allocation efficiency.
            </p>
          </div>

          <div className="p-3 rounded-lg bg-neutral-900/60 border border-neutral-800 sm:col-span-2">
            <div className="flex justify-between font-mono font-medium text-white mb-1">
              <span>Stability & Governance</span>
              <span className="text-amber-200">10% Weight</span>
            </div>
            <p className="text-neutral-400 text-[11px] leading-relaxed">
              Promoter group alignment, institutional shareholder stability, and disclosure consistency.
            </p>
          </div>
        </div>
      </div>

      {/* 3. Classification Thresholds */}
      <div className="card-chai p-6 rounded-xl border border-orange-50/15 bg-black/10">
        <h3 className="text-sm font-semibold text-white font-['Montserrat'] mb-3">
          Classification Thresholds & Risk Overrides
        </h3>
        <div className="space-y-3 text-xs">
          <div className="flex items-start gap-3 p-3 rounded-lg bg-emerald-950/10 border border-emerald-900/30">
            <span className="font-mono font-bold text-emerald-400 text-sm whitespace-nowrap">
              70 – 100
            </span>
            <div>
              <div className="font-semibold text-emerald-300">Favorable Research Signal</div>
              <p className="text-neutral-400 text-[11px] mt-0.5 leading-relaxed">
                Evidence suggests an attractive risk/reward profile with supportive technical momentum or strong fundamental compounding metrics.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-lg bg-amber-950/10 border border-amber-900/30">
            <span className="font-mono font-bold text-amber-400 text-sm whitespace-nowrap">
              45 – 69
            </span>
            <div>
              <div className="font-semibold text-amber-300">Neutral / Wait</div>
              <p className="text-neutral-400 text-[11px] mt-0.5 leading-relaxed">
                Signals are mixed or balanced. Quality fundamentals may be constrained by rich valuation, or technical trend may be consolidating.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-lg bg-rose-950/10 border border-rose-900/30">
            <span className="font-mono font-bold text-rose-400 text-sm whitespace-nowrap">
              0 – 44
            </span>
            <div>
              <div className="font-semibold text-rose-300">Unfavorable / Avoid</div>
              <p className="text-neutral-400 text-[11px] mt-0.5 leading-relaxed">
                Available evidence indicates unfavorable asymmetry, deteriorating top-line profitability, high leverage, or strong downward price momentum.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Data Transparency & Limitations */}
      <div className="p-5 rounded-xl bg-neutral-900/40 border border-neutral-800 text-xs space-y-3">
        <div className="flex items-center gap-2 font-semibold text-white">
          <Database className="w-4 h-4 text-orange-200" />
          <span>Data Sources & Free-Tier Plan Coverage</span>
        </div>
        <p className="text-neutral-400 leading-relaxed">
          All equities, prices, and corporate filings are retrieved directly from the official <strong>BharatStock API</strong> for Indian stocks (NSE and BSE).
        </p>
        <ul className="text-neutral-400 space-y-1 list-disc list-inside text-[11px] leading-relaxed">
          <li>Daily prices are official exchange closing prices (EOD), not tick-by-tick intraday feeds.</li>
          <li>On the BharatStock Free tier, historical price and timeseries data is bounded to the most recent 1 year of trading sessions.</li>
          <li>If a metric is absent or unfiled, our engine penalizes confidence rather than assuming it is favorable.</li>
        </ul>
      </div>

      {/* 5. Essential Disclaimer */}
      <div className="p-4 rounded-xl border border-neutral-800 text-xs text-neutral-500 leading-relaxed flex items-start gap-2">
        <AlertCircle className="w-4 h-4 text-neutral-600 shrink-0 mt-0.5" />
        <span>
          <strong>Important Disclaimer:</strong> Quantitative scores and recommendations produced by PickMyStock are heuristic research signals designed to organize and explain historical market data. They do not constitute investment advice, solicitations, or guarantees of future capital returns.
        </span>
      </div>
    </div>
  );
};
