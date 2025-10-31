import { cn } from '../lib/cn';
import type { JobStage, ProgressUpdate, ReviewMode } from '../types';

const STAGE_LABELS: Record<JobStage, string> = {
  idle: 'Pending',
  sources: 'Sources found',
  fetching: 'Pages fetched',
  extracting: 'Claims extracted',
  verifying: 'Verified',
  exporting: 'Exported',
  complete: 'Complete',
  error: 'Error',
  cancelled: 'Cancelled'
};

interface RunProgressProps {
  mode: ReviewMode;
  stage: JobStage;
  updates: ProgressUpdate[];
  isRunning: boolean;
  onCancel: () => void;
  onRetry: () => void;
  onEditSources: () => void;
  error?: string | null;
}

export function RunProgress({
  mode,
  stage,
  updates,
  isRunning,
  onCancel,
  onRetry,
  onEditSources,
  error
}: RunProgressProps) {
  const sequence: JobStage[] = ['sources', 'fetching', 'extracting', 'verifying', 'exporting'];
  const latest = updates.length ? updates[updates.length - 1] : undefined;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Running teardown</h2>
          <p className="mt-1 text-sm text-slate-600">
            Mode: <span className="font-medium capitalize">{mode}</span>. We’ll progress through sourcing, fetching, extraction, verification, and export.
          </p>
        </div>
        <button
          type="button"
          onClick={onEditSources}
          className="text-sm font-semibold text-brand-600 hover:text-brand-700"
        >
          Edit sources
        </button>
      </div>

      <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-900">Progress</h3>
          <ol className="mt-4 space-y-3">
            {sequence.map((item) => (
              <li key={item} className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span
                    className={cn(
                      'flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold',
                      stage === item
                        ? 'bg-brand-600 text-white'
                        : updates.find((update) => update.stage === item)
                        ? 'bg-brand-100 text-brand-700'
                        : 'bg-slate-100 text-slate-500'
                    )}
                  >
                    {sequence.indexOf(item) + 1}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-slate-900">{STAGE_LABELS[item]}</p>
                    {latest?.stage === item && (
                      <p className="text-xs text-slate-500">{latest.highlights[0]}</p>
                    )}
                  </div>
                </div>
                <span className="text-xs font-medium text-slate-500">
                  {renderCounts(item, latest?.counts)}
                </span>
              </li>
            ))}
          </ol>

          <div className="mt-4 flex items-center gap-3">
            {isRunning ? (
              <button
                type="button"
                onClick={onCancel}
                className="inline-flex items-center rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 shadow-sm hover:border-slate-300"
              >
                Cancel run
              </button>
            ) : (
              <button
                type="button"
                onClick={onRetry}
                className="inline-flex items-center rounded-lg bg-brand-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-700"
              >
                Retry
              </button>
            )}
            {error && <p className="text-sm text-red-600">{error}</p>}
          </div>
        </section>

        <aside className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <h4 className="text-sm font-semibold text-slate-900">Live highlights</h4>
            <ul className="mt-3 space-y-2 text-sm text-slate-600">
              {(latest?.highlights ?? ['Collecting signals...']).map((highlight, index) => (
                <li key={index} className="rounded-md bg-slate-50 px-3 py-2">
                  {highlight}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            <p className="font-semibold">Stay involved</p>
            <p className="mt-1">
              Remove or add URLs before finalisation if you spot noise. Strict mode requires ≥2 unique sources per accepted claim.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}

function renderCounts(stage: JobStage, counts?: ProgressUpdate['counts']) {
  if (!counts) return '--';
  switch (stage) {
    case 'sources':
      return `${counts.sourcesFound} sources`;
    case 'fetching':
      return `${counts.pagesFetched} pages`;
    case 'extracting':
      return `${counts.claimsExtracted} raw claims`;
    case 'verifying':
      return `${counts.claimsVerified} verified`;
    case 'exporting':
      return `${counts.exportsGenerated} exports`;
    default:
      return '--';
  }
}
