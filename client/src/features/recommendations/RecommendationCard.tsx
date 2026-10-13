import React, { useState } from 'react';
import {
  TrendingUp,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Info,
} from 'lucide-react';
import { HorizonRecommendation } from '../../types';

interface RecommendationCardProps {
  recommendation: HorizonRecommendation;
  symbol: string;
}

export const RecommendationCard: React.FC<RecommendationCardProps> = ({
  recommendation,
  symbol,
}) => {
  const [showAllFactors, setShowAllFactors] = useState(false);
  const {
    horizon,
    score,
    classification,
    confidence,
    positiveFactors,
    negativeFactors,
    allFactors,
    importantRisks,
    missingData,
    explanation,
    disclaimer,
    dataTimestamp,
  } = recommendation;

  const isShortTerm = horizon === 'short_term';
  const title = isShortTerm ? 'Short-Term Research Signal' : 'Long-Term Research Signal';
  const timeframe = isShortTerm ? 'Approx. 1–20 Trading Days' : 'Approx. 1–3 Years & Beyond';

  // Classification styling (strictly adhering to ChaiUI: text or thin outline, never orange buttons)
  const getBadgeStyle = () => {
    switch (classification) {
      case 'favorable':
        return 'border border-emerald-500/40 text-emerald-400 bg-emerald-950/20';
      case 'neutral':
        return 'border border-amber-500/40 text-amber-400 bg-amber-950/20';
      case 'unfavorable':
        return 'border border-rose-500/40 text-rose-400 bg-rose-950/20';
      case 'insufficient_data':
      default:
        return 'border border-neutral-700 text-neutral-400 bg-neutral-900';
    }
  };

  const getClassificationLabel = () => {
    switch (classification) {
      case 'favorable':
        return 'Favorable Signal';
      case 'neutral':
        return 'Neutral / Wait';
      case 'unfavorable':
        return 'Unfavorable / Avoid';
      case 'insufficient_data':
      default:
        return 'Insufficient Data';
    }
  };

  return (
    <div className="card-chai rounded-xl p-5 border border-orange-50/15 bg-black/10 backdrop-blur-sm flex flex-col justify-between">
      <div>
        {/* Card Header */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <div className="text-xs uppercase tracking-wider text-neutral-500 font-mono mb-1">
              {timeframe}
            </div>
            <h3 className="text-lg font-semibold text-white font-['Montserrat']">
              {title}
            </h3>
          </div>
          <div className="text-right">
            <span
              className={`inline-block px-2.5 py-1 rounded-md text-xs font-medium ${getBadgeStyle()}`}
            >
              {getClassificationLabel()}
            </span>
            <div className="text-[11px] text-neutral-500 mt-1 font-mono">
              Confidence: {confidence}
            </div>
          </div>
        </div>

        {/* Score Display */}
        <div className="flex items-center gap-4 py-3 px-4 rounded-lg bg-neutral-900/60 border border-neutral-800/80 mb-4">
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-bold font-mono text-white">{score}</span>
            <span className="text-xs text-neutral-500 font-mono">/100</span>
          </div>

          <div className="flex-1">
            <div className="w-full bg-neutral-800 h-2 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ${
                  classification === 'favorable'
                    ? 'bg-emerald-500'
                    : classification === 'neutral'
                      ? 'bg-amber-400'
                      : 'bg-rose-500'
                }`}
                style={{ width: `${Math.max(4, score)}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-neutral-500 mt-1 font-mono">
              <span>0 (Avoid)</span>
              <span>45 (Neutral)</span>
              <span>70 (Favorable)</span>
              <span>100</span>
            </div>
          </div>
        </div>

        {/* Plain-English Explanation */}
        <p className="text-sm text-neutral-300 leading-relaxed mb-4">
          {explanation}
        </p>

        {/* Positive Supporting Factors */}
        {positiveFactors.length > 0 && (
          <div className="mb-4">
            <div className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5 mb-2">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Positive Supporting Drivers ({positiveFactors.length})
            </div>
            <div className="space-y-1.5">
              {positiveFactors.slice(0, 3).map((factor) => (
                <div
                  key={factor.id}
                  className="p-2 rounded bg-neutral-900/40 border border-emerald-950/40 text-xs flex items-start justify-between gap-2"
                >
                  <div>
                    <span className="font-medium text-white">{factor.name}</span>
                    <p className="text-neutral-400 text-[11px] mt-0.5">{factor.interpretation}</p>
                  </div>
                  <span className="text-emerald-400 font-mono text-[11px] whitespace-nowrap">
                    {factor.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Negative Supporting Factors / Headwinds */}
        {negativeFactors.length > 0 && (
          <div className="mb-4">
            <div className="text-xs font-semibold text-rose-400 flex items-center gap-1.5 mb-2">
              <XCircle className="w-3.5 h-3.5" />
              Negative Factors & Headwinds ({negativeFactors.length})
            </div>
            <div className="space-y-1.5">
              {negativeFactors.slice(0, 2).map((factor) => (
                <div
                  key={factor.id}
                  className="p-2 rounded bg-neutral-900/40 border border-rose-950/40 text-xs flex items-start justify-between gap-2"
                >
                  <div>
                    <span className="font-medium text-white">{factor.name}</span>
                    <p className="text-neutral-400 text-[11px] mt-0.5">{factor.interpretation}</p>
                  </div>
                  <span className="text-rose-400 font-mono text-[11px] whitespace-nowrap">
                    {factor.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Important Risks Disclosed */}
        {importantRisks.length > 0 && (
          <div className="mb-4 p-3 rounded-lg bg-neutral-900/50 border border-amber-900/20">
            <div className="text-xs font-semibold text-amber-400 flex items-center gap-1.5 mb-1.5">
              <AlertTriangle className="w-3.5 h-3.5" />
              Important Risks to Monitor
            </div>
            <ul className="text-xs text-neutral-300 space-y-1 list-disc list-inside">
              {importantRisks.map((risk, idx) => (
                <li key={idx} className="leading-snug">{risk}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Missing Data Warning */}
        {missingData.length > 0 && (
          <div className="mb-4 p-2.5 rounded-lg bg-neutral-900/70 border border-neutral-800 text-xs text-neutral-400 flex items-start gap-2">
            <HelpCircle className="w-4 h-4 text-neutral-500 shrink-0 mt-0.5" />
            <div>
              <span className="font-medium text-neutral-300">Data gaps detected:</span>{' '}
              {missingData.join(', ')}. (Score penalized rather than assumed favorable).
            </div>
          </div>
        )}

        {/* Collapsible Structured Evidence Drill-down */}
        <div className="mt-2 border-t border-neutral-900 pt-3">
          <button
            onClick={() => setShowAllFactors(!showAllFactors)}
            className="text-xs text-neutral-400 hover:text-white flex items-center gap-1 cursor-pointer transition-colors"
          >
            {showAllFactors ? (
              <>
                <ChevronUp className="w-3.5 h-3.5" /> Hide Factor Evidence
              </>
            ) : (
              <>
                <ChevronDown className="w-3.5 h-3.5" /> View Structured Factor Evidence ({allFactors.length})
              </>
            )}
          </button>

          {showAllFactors && (
            <div className="mt-3 space-y-2 max-h-72 overflow-y-auto pr-1">
              {allFactors.map((f) => (
                <div
                  key={f.id}
                  className="p-2.5 rounded bg-neutral-900 border border-neutral-800 text-xs"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-white">{f.name}</span>
                    <span className="text-[11px] text-neutral-500 font-mono">
                      Weight: {(f.weight * 100).toFixed(0)}% · Score: {f.score}/100
                    </span>
                  </div>
                  <div className="text-neutral-400 text-[11px] mb-1">
                    <strong>Calc:</strong> {f.calculation}
                  </div>
                  <div className="text-neutral-400 text-[11px]">
                    <strong>Source:</strong> {f.source}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Card Footer / Disclaimer */}
      <div className="mt-4 pt-3 border-t border-neutral-900 text-[10px] text-neutral-500 flex items-start gap-1.5 leading-tight">
        <Info className="w-3 h-3 text-neutral-600 shrink-0 mt-0.5" />
        <span>{disclaimer} Timestamp: {dataTimestamp.split('T')[0]}.</span>
      </div>
    </div>
  );
};
