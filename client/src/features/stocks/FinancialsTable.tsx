import React, { useState } from 'react';
import { FinancialRatios, FinancialStatement, Shareholding } from '../../types';

interface FinancialsTableProps {
  financials: FinancialStatement[];
  ratios: FinancialRatios | null;
  shareholding: Shareholding[];
  periodType: string;
  onPeriodTypeChange: (type: 'quarterly' | 'annual') => void;
}

export const FinancialsTable: React.FC<FinancialsTableProps> = ({
  financials,
  ratios,
  shareholding,
  periodType,
  onPeriodTypeChange,
}) => {
  const [activeTab, setActiveTab] = useState<'ratios' | 'statements' | 'ownership'>('ratios');

  const formatCr = (val?: number | null) => {
    if (val === null || val === undefined) return '—';
    return `₹${(val / 1e7).toLocaleString('en-IN', { maximumFractionDigits: 1 })} Cr`;
  };

  const formatPct = (val?: number | null) => {
    if (val === null || val === undefined) return '—';
    return `${val.toFixed(2)}%`;
  };

  const formatMultiple = (val?: number | null) => {
    if (val === null || val === undefined) return '—';
    return `${val.toFixed(2)}x`;
  };

  return (
    <div className="card-chai rounded-xl p-5 border border-orange-50/15 bg-black/10 backdrop-blur-sm">
      {/* Table Header and Nav */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div>
          <h3 className="text-base font-semibold text-white font-['Montserrat']">
            Financial Statements & Key Ratios
          </h3>
          <p className="text-xs text-neutral-400">
            Official regulatory disclosures filed with Indian exchanges
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Section Tabs */}
          <div className="flex items-center gap-1 bg-neutral-900 p-0.5 rounded-lg border border-neutral-800 text-xs">
            <button
              onClick={() => setActiveTab('ratios')}
              className={`px-3 py-1 rounded transition-colors cursor-pointer ${
                activeTab === 'ratios'
                  ? 'bg-neutral-800 text-white font-medium'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Key Ratios
            </button>
            <button
              onClick={() => setActiveTab('statements')}
              className={`px-3 py-1 rounded transition-colors cursor-pointer ${
                activeTab === 'statements'
                  ? 'bg-neutral-800 text-white font-medium'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Income Statement
            </button>
            <button
              onClick={() => setActiveTab('ownership')}
              className={`px-3 py-1 rounded transition-colors cursor-pointer ${
                activeTab === 'ownership'
                  ? 'bg-neutral-800 text-white font-medium'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Ownership
            </button>
          </div>

          {/* Quarterly / Annual toggle */}
          {activeTab === 'statements' && (
            <div className="flex items-center gap-1 bg-neutral-900 p-0.5 rounded-lg border border-neutral-800 text-xs">
              <button
                onClick={() => onPeriodTypeChange('quarterly')}
                className={`px-2.5 py-1 rounded cursor-pointer ${
                  periodType === 'quarterly'
                    ? 'bg-neutral-800 text-white font-medium'
                    : 'text-neutral-400'
                }`}
              >
                Quarterly
              </button>
              <button
                onClick={() => onPeriodTypeChange('annual')}
                className={`px-2.5 py-1 rounded cursor-pointer ${
                  periodType === 'annual'
                    ? 'bg-neutral-800 text-white font-medium'
                    : 'text-neutral-400'
                }`}
              >
                Annual
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 1. Valuation & Profitability Ratios Grid */}
      {activeTab === 'ratios' && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          <div className="p-3 rounded-lg bg-neutral-900/60 border border-neutral-800/80">
            <div className="text-[11px] text-neutral-400 font-mono">P/E Ratio (TTM)</div>
            <div className="text-lg font-semibold font-mono text-white mt-1">
              {formatMultiple(ratios?.peRatio)}
            </div>
            <div className="text-[10px] text-neutral-500 mt-1">Price to Earnings</div>
          </div>

          <div className="p-3 rounded-lg bg-neutral-900/60 border border-neutral-800/80">
            <div className="text-[11px] text-neutral-400 font-mono">P/B Ratio</div>
            <div className="text-lg font-semibold font-mono text-white mt-1">
              {formatMultiple(ratios?.pbRatio)}
            </div>
            <div className="text-[10px] text-neutral-500 mt-1">Price to Book Value</div>
          </div>

          <div className="p-3 rounded-lg bg-neutral-900/60 border border-neutral-800/80">
            <div className="text-[11px] text-neutral-400 font-mono">Return on Equity (ROE)</div>
            <div className="text-lg font-semibold font-mono text-emerald-400 mt-1">
              {formatPct(ratios?.roe)}
            </div>
            <div className="text-[10px] text-neutral-500 mt-1">Net Income / Equity</div>
          </div>

          <div className="p-3 rounded-lg bg-neutral-900/60 border border-neutral-800/80">
            <div className="text-[11px] text-neutral-400 font-mono">ROCE</div>
            <div className="text-lg font-semibold font-mono text-emerald-400 mt-1">
              {formatPct(ratios?.roce)}
            </div>
            <div className="text-[10px] text-neutral-500 mt-1">Return on Capital Employed</div>
          </div>

          <div className="p-3 rounded-lg bg-neutral-900/60 border border-neutral-800/80">
            <div className="text-[11px] text-neutral-400 font-mono">Dividend Yield</div>
            <div className="text-lg font-semibold font-mono text-white mt-1">
              {formatPct(ratios?.dividendYield)}
            </div>
            <div className="text-[10px] text-neutral-500 mt-1">Annual dividend yield</div>
          </div>

          <div className="p-3 rounded-lg bg-neutral-900/60 border border-neutral-800/80">
            <div className="text-[11px] text-neutral-400 font-mono">52-Week Range</div>
            <div className="text-sm font-semibold font-mono text-white mt-1">
              ₹{ratios?.week52Low ?? '—'} - ₹{ratios?.week52High ?? '—'}
            </div>
            <div className="text-[10px] text-neutral-500 mt-1">1-year trading boundary</div>
          </div>

          <div className="p-3 rounded-lg bg-neutral-900/60 border border-neutral-800/80">
            <div className="text-[11px] text-neutral-400 font-mono">Debt-to-Equity</div>
            <div className="text-lg font-semibold font-mono text-white mt-1">
              {formatMultiple(financials[0]?.debtEquityRatio)}
            </div>
            <div className="text-[10px] text-neutral-500 mt-1">Latest reported period</div>
          </div>

          <div className="p-3 rounded-lg bg-neutral-900/60 border border-neutral-800/80">
            <div className="text-[11px] text-neutral-400 font-mono">Free Cash Flow</div>
            <div className="text-lg font-semibold font-mono text-white mt-1">
              {formatCr(financials[0]?.freeCashFlow)}
            </div>
            <div className="text-[10px] text-neutral-500 mt-1">Operating CF − CapEx</div>
          </div>
        </div>
      )}

      {/* 2. Statement Disclosures Table */}
      {activeTab === 'statements' && (
        <div className="overflow-x-auto">
          {financials.length > 0 ? (
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-neutral-800 text-neutral-500 font-mono text-[11px]">
                  <th className="py-2.5 px-3">Metric</th>
                  {financials.slice(0, 5).map((f) => (
                    <th key={f.periodEndDate} className="py-2.5 px-3 text-right">
                      {f.periodEndDate}
                      <span className="block text-[10px] text-neutral-600 font-normal">
                        {f.fiscalYear || f.periodType}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-900">
                <tr className="hover:bg-neutral-900/40">
                  <td className="py-2.5 px-3 font-medium text-white">Revenue</td>
                  {financials.slice(0, 5).map((f) => (
                    <td key={f.periodEndDate} className="py-2.5 px-3 text-right font-mono text-neutral-200">
                      {formatCr(f.revenue)}
                    </td>
                  ))}
                </tr>
                <tr className="hover:bg-neutral-900/40">
                  <td className="py-2.5 px-3 font-medium text-white">Operating Profit</td>
                  {financials.slice(0, 5).map((f) => (
                    <td key={f.periodEndDate} className="py-2.5 px-3 text-right font-mono text-neutral-200">
                      {formatCr(f.operatingProfit)}
                    </td>
                  ))}
                </tr>
                <tr className="hover:bg-neutral-900/40">
                  <td className="py-2.5 px-3 font-medium text-white">Net Profit (PAT)</td>
                  {financials.slice(0, 5).map((f) => (
                    <td
                      key={f.periodEndDate}
                      className={`py-2.5 px-3 text-right font-mono font-medium ${
                        f.netProfit && f.netProfit > 0 ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {formatCr(f.netProfit)}
                    </td>
                  ))}
                </tr>
                <tr className="hover:bg-neutral-900/40">
                  <td className="py-2.5 px-3 text-neutral-400">EPS</td>
                  {financials.slice(0, 5).map((f) => (
                    <td key={f.periodEndDate} className="py-2.5 px-3 text-right font-mono text-neutral-300">
                      {f.eps !== null && f.eps !== undefined ? `₹${f.eps.toFixed(2)}` : '—'}
                    </td>
                  ))}
                </tr>
                <tr className="hover:bg-neutral-900/40">
                  <td className="py-2.5 px-3 text-neutral-400">Operating Cash Flow</td>
                  {financials.slice(0, 5).map((f) => (
                    <td key={f.periodEndDate} className="py-2.5 px-3 text-right font-mono text-neutral-300">
                      {formatCr(f.cashFlowOperating)}
                    </td>
                  ))}
                </tr>
                <tr className="hover:bg-neutral-900/40">
                  <td className="py-2.5 px-3 text-neutral-400">Debt-to-Equity</td>
                  {financials.slice(0, 5).map((f) => (
                    <td key={f.periodEndDate} className="py-2.5 px-3 text-right font-mono text-neutral-300">
                      {formatMultiple(f.debtEquityRatio)}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          ) : (
            <div className="py-8 text-center text-neutral-500 text-xs">
              No financial filings available for this reporting period.
            </div>
          )}
        </div>
      )}

      {/* 3. Ownership / Shareholding */}
      {activeTab === 'ownership' && (
        <div>
          {shareholding.length > 0 ? (
            <div className="space-y-3">
              {shareholding.map((sh, idx) => (
                <div key={idx} className="p-3.5 rounded-lg bg-neutral-900/60 border border-neutral-800">
                  <div className="flex justify-between text-xs text-neutral-400 font-mono mb-2">
                    <span>As of {sh.asOnDate}</span>
                    <span>SEBI Shareholding Disclosure</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div>
                      <div className="text-[11px] text-neutral-500">Promoter Group</div>
                      <div className="text-base font-semibold font-mono text-white">
                        {sh.promoterPct.toFixed(2)}%
                      </div>
                    </div>
                    <div>
                      <div className="text-[11px] text-neutral-500">Public & Institutions</div>
                      <div className="text-base font-semibold font-mono text-white">
                        {sh.publicPct.toFixed(2)}%
                      </div>
                    </div>
                    <div>
                      <div className="text-[11px] text-neutral-500">Employee Trust</div>
                      <div className="text-base font-semibold font-mono text-white">
                        {sh.employeeTrustPct ? `${sh.employeeTrustPct.toFixed(2)}%` : '0.00%'}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-neutral-500 text-xs">
              Shareholding disclosure not filed or currently unavailable.
            </div>
          )}
        </div>
      )}
    </div>
  );
};
