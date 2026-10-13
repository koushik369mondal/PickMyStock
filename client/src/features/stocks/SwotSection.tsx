import React from 'react';
import { ShieldCheck, AlertCircle, Compass, Flame, Info } from 'lucide-react';
import { SwotResearch } from '../../types';

interface SwotSectionProps {
  swotData: SwotResearch | null;
  symbol: string;
}

export const SwotSection: React.FC<SwotSectionProps> = ({ swotData, symbol }) => {
  if (!swotData) return null;

  const { swot, newsDisclaimer } = swotData;

  return (
    <div className="card-chai rounded-xl p-5 border border-orange-50/15 bg-black/10 backdrop-blur-sm">
      <div className="flex items-center justify-between gap-3 mb-4">
        <div>
          <h3 className="text-base font-semibold text-white font-['Montserrat']">
            Evidence-Based Strategic SWOT Analysis
          </h3>
          <p className="text-xs text-neutral-400">
            Synthesized from verified quarterly disclosures and capital ratios for {symbol}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Strengths */}
        <div className="p-4 rounded-xl bg-neutral-900/50 border border-emerald-950/40">
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 mb-2.5 font-['Montserrat']">
            <ShieldCheck className="w-4 h-4" />
            Core Strengths (Verified Facts)
          </div>
          <ul className="space-y-2 text-xs text-neutral-300">
            {swot.strengths.map((str, idx) => (
              <li key={idx} className="flex items-start gap-2 leading-relaxed">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                <span>{str}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Weaknesses */}
        <div className="p-4 rounded-xl bg-neutral-900/50 border border-rose-950/40">
          <div className="flex items-center gap-2 text-xs font-semibold text-rose-400 mb-2.5 font-['Montserrat']">
            <AlertCircle className="w-4 h-4" />
            Weaknesses & Valuation Constraints
          </div>
          <ul className="space-y-2 text-xs text-neutral-300">
            {swot.weaknesses.map((w, idx) => (
              <li key={idx} className="flex items-start gap-2 leading-relaxed">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-400 mt-1.5 shrink-0" />
                <span>{w}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Opportunities */}
        <div className="p-4 rounded-xl bg-neutral-900/50 border border-blue-950/40">
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-400 mb-2.5 font-['Montserrat']">
            <Compass className="w-4 h-4" />
            Market & Industry Opportunities
          </div>
          <ul className="space-y-2 text-xs text-neutral-300">
            {swot.opportunities.map((opp, idx) => (
              <li key={idx} className="flex items-start gap-2 leading-relaxed">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 shrink-0" />
                <span>{opp}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Threats */}
        <div className="p-4 rounded-xl bg-neutral-900/50 border border-amber-950/40">
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-400 mb-2.5 font-['Montserrat']">
            <Flame className="w-4 h-4" />
            Macroeconomic & Competitive Threats
          </div>
          <ul className="space-y-2 text-xs text-neutral-300">
            {swot.threats.map((t, idx) => (
              <li key={idx} className="flex items-start gap-2 leading-relaxed">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                <span>{t}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-neutral-900 flex items-start gap-2 text-[11px] text-neutral-500">
        <Info className="w-3.5 h-3.5 shrink-0 mt-0.5 text-neutral-600" />
        <span>{newsDisclaimer}</span>
      </div>
    </div>
  );
};
