import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="mt-auto border-t border-orange-50/10 bg-[#0a0a0a] text-neutral-400 text-xs py-10 px-4 sm:px-6">
      <div className="w-[92%] 2xl:w-[94%] max-w-[1600px] mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2.5 mb-2">
            <img
              src="/Logo.png"
              alt="PickMyStock"
              className="w-5 h-5 rounded object-contain"
            />
            <span className="font-semibold text-white font-['Onest'] text-sm">
              PickMyStock
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded border border-neutral-700 text-neutral-400 font-mono">
              v1.0.0
            </span>
          </div>
          <p className="max-w-xl text-neutral-500 leading-relaxed">
            PickMyStock is an independent financial technology decision-support platform for research on Indian equities listed on NSE and BSE. Quantitative scores and heuristic indicators are computed deterministically from verified regulatory disclosures and daily market prices. This application does not provide investment guarantees or personalized financial advice.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 sm:gap-8 text-neutral-400">
          <div>
            <div className="font-medium text-neutral-300 mb-1">Market Data</div>
            <div className="text-[11px] text-neutral-500">
              End-of-day prices & financials sourced via BharatStock API.
            </div>
          </div>
          <div>
            <div className="font-medium text-neutral-300 mb-1">Compliance</div>
            <div className="text-[11px] text-neutral-500">
              For research and educational decision-support only.
            </div>
          </div>
        </div>
      </div>

      <div className="w-[92%] 2xl:w-[94%] max-w-[1600px] mx-auto mt-8 pt-6 border-t border-neutral-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-neutral-600">
        <div>© {new Date().getFullYear()} PickMyStock. All rights reserved.</div>
        <div>Built with ChaiUI design system and official BharatStock market data.</div>
      </div>
    </footer>
  );
};
