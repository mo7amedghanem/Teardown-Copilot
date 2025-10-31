import { cn } from '../lib/cn';

interface AnalysisStatsBarProps {
  step: number;
  sources: number;
  acceptedClaims: number;
  confidence: { high: number; medium: number; low: number };
}

export function AnalysisStatsBar({ step, sources, acceptedClaims, confidence }: AnalysisStatsBarProps) {
  return (
    <div className="sticky top-0 z-10 mb-6 bg-slate-50/80 backdrop-blur supports-[backdrop-filter]:bg-slate-50/60">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-6 py-3 text-xs text-slate-600">
        <div className="flex items-center gap-2 font-semibold uppercase tracking-wide text-slate-500">
          <span className="flex h-6 w-6 items-center justify-center rounded-full border border-slate-300 bg-white text-[11px] font-bold text-slate-700">
            {step}
          </span>
          Workflow tracker
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <StatPill label="Sources" value={sources ? sources.toString() : '—'} />
          <StatPill label="Accepted claims" value={acceptedClaims ? acceptedClaims.toString() : '—'} />
          <StatPill
            label="Confidence"
            value={`${confidence.high} high · ${confidence.medium} med · ${confidence.low} low`}
          />
        </div>
      </div>
    </div>
  );
}

function StatPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-medium text-slate-700 shadow-sm">
      <span className="uppercase tracking-wide text-slate-400">{label}</span>
      <span className={cn('text-slate-900')}>{value}</span>
    </div>
  );
}
