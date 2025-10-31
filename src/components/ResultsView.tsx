import { useMemo, useState } from 'react';
import type { ComponentType, SVGProps } from 'react';
import {
  ArrowDownTrayIcon,
  ArrowPathIcon,
  ArrowTopRightOnSquareIcon,
  DocumentDuplicateIcon
} from './icons';
import { cn } from '../lib/cn';
import type { Claim, ResultsPayload, ReviewMode, ScenarioType } from '../types';
import { computeConfidenceBuckets } from '../lib/validation';
import { scheduleWeeklyRefresh } from '../lib/mockBackend';

interface ResultsViewProps {
  projectName: string;
  scenario: ScenarioType;
  mode: ReviewMode;
  results: ResultsPayload;
  notionEnabled: boolean;
  onRestart: () => void;
}

export function ResultsView({ projectName, scenario, mode, results, notionEnabled, onRestart }: ResultsViewProps) {
  const [refreshing, setRefreshing] = useState(false);
  const [refreshEnabled, setRefreshEnabled] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const coverageLow = results.coverageLow || results.claims.length < 10 || !results.tables.pricing.length;

  const confidenceBuckets = useMemo(() => {
    return computeConfidenceBuckets(results.claims.map((claim) => claim.confidence));
  }, [results.claims]);

  const acceptedClaims = results.claims.filter((claim) => claim.confidence >= (mode === 'strict' ? 0.85 : 0.75)).length;

  const handleSchedule = async () => {
    setRefreshing(true);
    try {
      const response = await scheduleWeeklyRefresh(projectName, !refreshEnabled);
      setRefreshEnabled(!refreshEnabled);
      setFeedback(
        `Weekly refresh ${!refreshEnabled ? 'scheduled' : 'cancelled'} (${response.status ?? 'ok'}). Backend connectors required for automation.`
      );
    } catch (error) {
      setFeedback('Unable to update weekly refresh. Try again later.');
    } finally {
      setRefreshing(false);
    }
  };

  const handleDownloadBrief = () => {
    const blob = new Blob([results.briefMarkdown], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${projectName.replace(/\s+/g, '-').toLowerCase()}-teardown.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-8">
      {coverageLow && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
          <p className="font-semibold">Insufficient coverage</p>
          <p className="mt-1">
            We verified {acceptedClaims} claims and {results.tables.pricing.length ? 'found pricing signals.' : 'could not confirm pricing.'}
            Add more sources or enable Google Search grounding for deeper coverage.
          </p>
        </div>
      )}

      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">Teardown complete</h2>
          <p className="mt-1 text-sm text-slate-600">
            Scenario: <span className="font-medium capitalize">{scenario}</span> · Mode: <span className="font-medium capitalize">{mode}</span>
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <ActionButton
            icon={ArrowDownTrayIcon}
            label="Download brief (.md)"
            onClick={handleDownloadBrief}
          />
          <ActionButton
            icon={ArrowTopRightOnSquareIcon}
            label="Open Notion dataset"
            onClick={() => {
              if (notionEnabled && results.notionUrls[0]) {
                window.open(results.notionUrls[0], '_blank', 'noopener');
              } else {
                setFeedback('Connect the backend to push datasets to Notion.');
              }
            }}
          />
          <ActionButton icon={DocumentDuplicateIcon} label="Copy brief markdown" onClick={() => copyToClipboard(results.briefMarkdown, setFeedback)} />
        </div>
      </header>

      <section className="grid gap-4 sm:grid-cols-3">
        <MetricCard label="Sources" value={results.competitors.length} />
        <MetricCard label="Accepted claims" value={acceptedClaims} />
        <MetricCard
          label="Confidence split"
          value={`${confidenceBuckets.high} high · ${confidenceBuckets.medium} med · ${confidenceBuckets.low} low`}
        />
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-900">Pricing summary</h3>
          <span className="text-xs uppercase tracking-wide text-slate-400">Cited rows</span>
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-2">Competitor</th>
                <th className="px-4 py-2">Plan</th>
                <th className="px-4 py-2">Price</th>
                <th className="px-4 py-2">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {results.tables.pricing.map((row) => (
                <tr key={`${row.competitor}-${row.plan}`} className="bg-white">
                  <td className="px-4 py-3 font-medium text-slate-900">{row.competitor}</td>
                  <td className="px-4 py-3 text-slate-700">{row.plan ?? '—'}</td>
                  <td className="px-4 py-3 text-slate-700">{row.price ?? '—'}</td>
                  <td className="px-4 py-3 text-xs text-slate-500">{row.notes ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {!results.tables.pricing.length && <EmptyState message="No verified pricing yet." />}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-900">Feature matrix</h3>
          <span className="text-xs uppercase tracking-wide text-slate-400">Highlights</span>
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-2">Competitor</th>
                <th className="px-4 py-2">Features</th>
                <th className="px-4 py-2">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {results.tables.features.map((row) => (
                <tr key={row.competitor} className="bg-white">
                  <td className="px-4 py-3 font-medium text-slate-900">{row.competitor}</td>
                  <td className="px-4 py-3 text-slate-700">{row.features?.join(', ') ?? '—'}</td>
                  <td className="px-4 py-3 text-xs text-slate-500">{row.notes ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {!results.tables.features.length && <EmptyState message="No feature coverage yet." />}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-900">Key claims</h3>
          <span className="text-xs uppercase tracking-wide text-slate-400">10–15 verified</span>
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {results.claims.map((claim) => (
            <ClaimCard key={claim.id} claim={claim} mode={mode} />
          ))}
          {!results.claims.length && <EmptyState message="No verified claims yet." />}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-900">Actions</h3>
          <span className="text-xs uppercase tracking-wide text-slate-400">Automation</span>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleSchedule}
            disabled={refreshing}
            className={cn(
              'inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold shadow-sm transition',
              refreshEnabled ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-slate-200 bg-white text-slate-700',
              refreshing && 'opacity-60'
            )}
          >
            <ArrowPathIcon className={cn('h-4 w-4', refreshing && 'animate-spin')} aria-hidden="true" />
            {refreshEnabled ? 'Weekly refresh on' : 'Schedule weekly refresh'}
          </button>
          <button
            type="button"
            onClick={onRestart}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:border-slate-300"
          >
            Restart workflow
          </button>
        </div>
        <p className="mt-2 text-xs text-slate-500">
          Weekly refresh requires backend connectors. Audit-only runs skip pricing tables and emphasise issues + evidence.
        </p>
        {feedback && <p className="mt-2 text-sm text-slate-600">{feedback}</p>}
      </section>
    </div>
  );
}

interface MetricCardProps {
  label: string;
  value: number | string;
}

function MetricCard({ label, value }: MetricCardProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-slate-900">{value}</p>
    </div>
  );
}

interface ClaimCardProps {
  claim: Claim;
  mode: ReviewMode;
}

function ClaimCard({ claim, mode }: ClaimCardProps) {
  const passesStrict =
    claim.groundedness >= 0.9 && claim.context >= 0.8 && claim.answerRelevance >= 0.8 && claim.sources.length >= 2;
  const passesBalanced =
    claim.groundedness >= 0.75 && claim.context >= 0.75 && claim.answerRelevance >= 0.75 && claim.sources.length >= 1;

  const pass = mode === 'strict' ? passesStrict : passesBalanced;

  return (
    <div className={cn('rounded-xl border p-4 shadow-sm', pass ? 'border-slate-200 bg-white' : 'border-amber-400 bg-amber-50')}>
      <p className="text-sm text-slate-900">{claim.text}</p>
      <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-500">
        <span className="rounded-full bg-slate-100 px-2 py-1 font-semibold text-slate-700">
          Confidence {Math.round(claim.confidence * 100)}%
        </span>
        <span>Groundedness {claim.groundedness}</span>
        <span>Context {claim.context}</span>
        <span>Answer relevance {claim.answerRelevance}</span>
      </div>
      <div className="mt-3 space-y-2 text-xs">
        <p className="font-semibold text-slate-700">Sources ({claim.sources.length})</p>
        <ul className="space-y-1">
          {claim.sources.map((source, index) => (
            <li key={index} className="flex items-start gap-2 text-slate-500">
              <span className="mt-0.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-brand-500" />
              <a href={source.url} target="_blank" rel="noopener noreferrer" className="text-brand-600 hover:text-brand-700">
                {truncate(source.url, 60)}
              </a>
              <span className="text-slate-400">— {source.snippet}</span>
            </li>
          ))}
        </ul>
      </div>
      {!pass && (
        <p className="mt-3 text-xs font-medium text-amber-700">
          Flagged under {mode} mode — requires additional sourcing or verification.
        </p>
      )}
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return <p className="px-4 py-6 text-center text-sm text-slate-500">{message}</p>;
}

function truncate(text: string, length: number) {
  if (text.length <= length) return text;
  return `${text.slice(0, length - 1)}…`;
}

async function copyToClipboard(value: string, setFeedback: (message: string) => void) {
  try {
    await navigator.clipboard.writeText(value);
    setFeedback('Brief copied to clipboard.');
  } catch (error) {
    setFeedback('Clipboard copy failed. Select the text manually.');
  }
}

interface ActionButtonProps {
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  label: string;
  onClick: () => void;
}

function ActionButton({ icon: Icon, label, onClick }: ActionButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-brand-500 hover:text-brand-600"
    >
      <Icon className="h-4 w-4" aria-hidden="true" />
      {label}
    </button>
  );
}
