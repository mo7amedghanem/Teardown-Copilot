import { useState } from 'react';
import { PlusIcon, ArrowUturnLeftIcon } from './icons';
import { cn } from '../lib/cn';
import type { ScenarioType } from '../types';
import { getDomain, isPaywalled, normaliseUrl, validateUrlList } from '../lib/validation';

export interface SourceItem {
  url: string;
  domain: string;
  warning?: string;
  paywalled?: boolean;
}

interface SourceReviewProps {
  scenario: ScenarioType;
  sources: SourceItem[];
  onSourcesChange: (sources: SourceItem[]) => void;
  onBack: () => void;
  onContinue: () => void;
  allowSkip: boolean;
}

const PAYWALL_HINT =
  'Paywalled source detected. We will attempt extraction but verification may be slower.';

export function SourceReview({
  scenario,
  sources,
  onSourcesChange,
  onBack,
  onContinue,
  allowSkip
}: SourceReviewProps) {
  const [inputValue, setInputValue] = useState('');
  const [error, setError] = useState<string | null>(null);

  const minSources = scenario === 'audit' ? 1 : 3;

  const handleAdd = () => {
    const candidate = normaliseUrl(inputValue);
    if (!candidate) return;
    if (!/^https?:\/\//i.test(candidate)) {
      setError('Only http(s) URLs are supported.');
      return;
    }
    const domain = getDomain(candidate);
    if (sources.some((item) => item.domain === domain)) {
      setError('That domain is already in the list.');
      return;
    }
    const paywalled = isPaywalled(candidate);
    const updated = [
      ...sources,
      {
        url: candidate,
        domain,
        paywalled,
        warning: paywalled ? PAYWALL_HINT : undefined
      }
    ];
    onSourcesChange(updated);
    setInputValue('');
    setError(null);
  };

  const handleRemove = (domain: string) => {
    const updated = sources.filter((source) => source.domain !== domain);
    onSourcesChange(updated);
  };

  const handleContinue = () => {
    const validation = validateUrlList(
      sources.map((source) => source.url),
      minSources,
      25
    );
    if (validation) {
      setError(validation);
      return;
    }
    setError(null);
    onContinue();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Review your sources</h2>
          <p className="mt-1 text-sm text-slate-600">
            Provide {minSources}+ unique domains. Remove anything irrelevant, and add new URLs if needed.
          </p>
        </div>
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 shadow-sm transition hover:border-slate-300"
        >
          <ArrowUturnLeftIcon className="h-4 w-4" aria-hidden="true" />
          Back
        </button>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="text-sm font-semibold text-slate-900">Sources ({sources.length})</h3>
        <div className="mt-4 flex flex-wrap gap-3">
          {sources.map((source) => (
            <div
              key={source.domain}
              className={cn(
                'group flex items-center gap-3 rounded-full border px-3 py-2 text-sm shadow-sm transition',
                source.paywalled ? 'border-amber-500 bg-amber-50 text-amber-800' : 'border-slate-200 bg-slate-50'
              )}
            >
              <img
                src={`https://www.google.com/s2/favicons?domain=${source.domain}&sz=32`}
                alt=""
                className="h-4 w-4"
              />
              <span className="font-medium text-slate-900">{source.domain}</span>
              <button
                type="button"
                onClick={() => handleRemove(source.domain)}
                className="ml-1 text-xs text-slate-500 underline opacity-0 transition group-hover:opacity-100"
              >
                remove
              </button>
            </div>
          ))}
          {!sources.length && (
            <p className="text-sm text-slate-500">Add URLs to build your teardown scope.</p>
          )}
        </div>
        {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
      </div>

      <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4">
        <label className="block text-sm font-medium text-slate-700">Add URL</label>
        <div className="mt-2 flex flex-col gap-2 sm:flex-row">
          <input
            value={inputValue}
            onChange={(event) => setInputValue(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                handleAdd();
              }
            }}
            placeholder="https://competitor.com/pricing"
            className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
          <button
            type="button"
            onClick={handleAdd}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-600 px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700"
          >
            <PlusIcon className="h-4 w-4" aria-hidden="true" />
            Add
          </button>
        </div>
        <p className="mt-2 text-xs text-slate-500">
          We de-duplicate domains automatically. Watch for paywalls—they’ll show in amber.
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        {allowSkip && (
          <button
            type="button"
            onClick={onContinue}
            className="text-sm font-semibold text-brand-600 hover:text-brand-700"
          >
            Skip to research plan
          </button>
        )}
        <div className="flex flex-1 justify-end gap-3">
          <button
            type="button"
            onClick={handleContinue}
            className="inline-flex items-center rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2"
          >
            Start run
          </button>
        </div>
      </div>
    </div>
  );
}

export function mapUrlsToSources(urls: string[]): SourceItem[] {
  return urls.map((url) => {
    const domain = getDomain(url);
    const paywalled = isPaywalled(url);
    return {
      url,
      domain,
      paywalled,
      warning: paywalled ? PAYWALL_HINT : undefined
    };
  });
}
