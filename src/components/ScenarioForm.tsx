import { CheckIcon } from './icons';
import { cn } from '../lib/cn';
import type { ReviewMode, ScenarioInputs, ScenarioType } from '../types';

const reviewModes: { value: ReviewMode; label: string; description: string }[] = [
  {
    value: 'strict',
    label: 'Strict Review',
    description: 'Requires ≥2 sources per claim and ≥0.9 groundedness.'
  },
  {
    value: 'balanced',
    label: 'Balanced Review',
    description: 'Allows exports with warnings if one metric dips below 0.8.'
  }
];

const timeframeOptions = ['6-12 months', '0-3 months', '3-6 months', '12+ months'];

const scenarioDescriptions: Record<ScenarioType, string> = {
  dreamer:
    'Give me a scope or problem space; I’ll propose initial competitors and a research plan you can prune.',
  pragmatist:
    'Paste competitor URLs and constraints; I’ll verify and compare pricing/features with citations.',
  operator:
    'Benchmark your product vs. others; optionally enable weekly change tracking.',
  audit:
    'Connect analytics (GA4/Hotjar) to add issues with evidence; otherwise I’ll run a heuristic-only pass.'
};

const scenarioLabels: Record<ScenarioType, string> = {
  dreamer: 'Dreamer',
  pragmatist: 'Pragmatist',
  operator: 'Operator',
  audit: 'Audit-only'
};

const scenarioOrder: ScenarioType[] = ['dreamer', 'pragmatist', 'operator', 'audit'];

interface ScenarioFormProps {
  inputs: ScenarioInputs;
  errors: Record<string, string>;
  onChange: <K extends keyof ScenarioInputs>(key: K, value: ScenarioInputs[K]) => void;
  onNext: () => void;
}

export function ScenarioForm({ inputs, errors, onChange, onNext }: ScenarioFormProps) {
  const renderScenarioFields = () => {
    switch (inputs.scenario) {
      case 'dreamer':
        return (
          <div className="space-y-4">
            <TextField
              label="Idea / business scope"
              value={inputs.ideaScope ?? ''}
              onChange={(value) => onChange('ideaScope', value)}
              error={errors.ideaScope}
              placeholder="e.g. AI agent for procurement teams"
            />
            <TextField
              label="Primary segment focus"
              value={inputs.segment}
              onChange={(value) => onChange('segment', value)}
              error={errors.segment}
              placeholder="e.g. Mid-market operations"
            />
          </div>
        );
      case 'pragmatist':
        return (
          <div className="space-y-4">
            <TextareaField
              label="Target segment"
              value={inputs.segment}
              onChange={(value) => onChange('segment', value)}
              error={errors.segment}
              placeholder="Describe who you’re selling to"
              rows={2}
            />
            <TextareaField
              label="Competitor URLs (3-10)"
              value={inputs.competitorUrls.join('\n')}
              onChange={(value) =>
                onChange(
                  'competitorUrls',
                  value
                    .split(/\n|,/) // allow commas
                    .map((item) => item.trim())
                    .filter(Boolean)
                )
              }
              error={errors.competitorUrls}
              placeholder="https://competitor-one.com\nhttps://competitor-two.com"
              rows={4}
            />
            <TextField
              label="Success metrics"
              value={inputs.successMetrics ?? ''}
              onChange={(value) => onChange('successMetrics', value)}
              error={errors.successMetrics}
              placeholder="e.g. Confirm TAM ≥$2B, validate 3 killer features"
            />
            <TextField
              label="Budget guardrails"
              value={inputs.budget ?? ''}
              onChange={(value) => onChange('budget', value)}
              error={errors.budget}
              placeholder="e.g. <$15k annually"
            />
          </div>
        );
      case 'operator':
        return (
          <div className="space-y-4">
            <TextField
              label="Your product URL"
              value={inputs.productUrl ?? ''}
              onChange={(value) => onChange('productUrl', value)}
              error={errors.productUrl}
              placeholder="https://yourproduct.com"
            />
            <TextareaField
              label="Primary segment"
              value={inputs.segment}
              onChange={(value) => onChange('segment', value)}
              error={errors.segment}
              rows={2}
              placeholder="e.g. Enterprise developer platforms"
            />
            <TextareaField
              label="Known competitors"
              value={inputs.knownCompetitors ?? ''}
              onChange={(value) => onChange('knownCompetitors', value)}
              error={errors.knownCompetitors}
              rows={3}
              placeholder="List competitors separated by commas"
            />
            <TextareaField
              label="Competitor URLs"
              value={inputs.competitorUrls.join('\n')}
              onChange={(value) =>
                onChange(
                  'competitorUrls',
                  value
                    .split(/\n|,/) // allow commas
                    .map((item) => item.trim())
                    .filter(Boolean)
                )
              }
              error={errors.competitorUrls}
              placeholder="https://competitor-one.com"
              rows={3}
            />
            <ToggleField
              label="Enable weekly refresh"
              description="Receive automated refresh runs every week once connected."
              enabled={inputs.weeklyRefresh}
              onToggle={(value) => onChange('weeklyRefresh', value)}
            />
          </div>
        );
      case 'audit':
        return (
          <div className="space-y-4">
            <TextField
              label="Site or app URL"
              value={inputs.productUrl ?? ''}
              onChange={(value) => onChange('productUrl', value)}
              error={errors.productUrl}
              placeholder="https://yourapp.com"
            />
            <div className="grid gap-4 md:grid-cols-2">
              <TextField
                label="GA4 property ID"
                value={inputs.ga4PropertyId ?? ''}
                onChange={(value) => onChange('ga4PropertyId', value)}
                error={errors.ga4PropertyId}
                placeholder="e.g. properties/123456"
              />
              <TextField
                label="GA4 OAuth token"
                value={inputs.ga4OAuth ?? ''}
                onChange={(value) => onChange('ga4OAuth', value)}
                error={errors.ga4OAuth}
                placeholder="Paste OAuth token"
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <TextField
                label="Hotjar site ID"
                value={inputs.hotjarSiteId ?? ''}
                onChange={(value) => onChange('hotjarSiteId', value)}
                error={errors.hotjarSiteId}
                placeholder="e.g. 123456"
              />
              <TextField
                label="Hotjar token"
                value={inputs.hotjarToken ?? ''}
                onChange={(value) => onChange('hotjarToken', value)}
                error={errors.hotjarToken}
                placeholder="Paste token"
              />
            </div>
            <p className="text-sm text-slate-500">
              Tokens are optional; if omitted we run a heuristic-only UX audit.
            </p>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Teardown Copilot</h1>
        <p className="mt-1 text-sm text-slate-600">
          Produce cited competitive teardowns with pricing tables, feature matrices, and Notion-ready exports.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-[2fr_1fr]">
        <div className="space-y-6">
          <section>
            <h2 className="text-sm font-medium uppercase tracking-wide text-slate-500">
              Scenario
            </h2>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {scenarioOrder.map((scenario) => (
                <button
                  key={scenario}
                  type="button"
                  onClick={() => onChange('scenario', scenario)}
                  className={cn(
                    'rounded-xl border p-4 text-left transition focus:outline-none focus:ring-2 focus:ring-brand-500',
                    inputs.scenario === scenario
                      ? 'border-brand-500 bg-brand-50'
                      : 'border-slate-200 hover:border-slate-300'
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-base font-semibold text-slate-900">
                      {scenarioLabels[scenario]}
                    </span>
                    {inputs.scenario === scenario && (
                      <CheckIcon className="h-5 w-5 text-brand-500" aria-hidden="true" />
                    )}
                  </div>
                  <p className="mt-2 text-sm text-slate-600">{scenarioDescriptions[scenario]}</p>
                </button>
              ))}
            </div>
          </section>

          <section className="space-y-4">
            <TextField
              label="Project name"
              value={inputs.projectName}
              onChange={(value) => onChange('projectName', value)}
              error={errors.projectName}
              placeholder="e.g. APAC launch teardown"
            />
            {inputs.scenario !== 'dreamer' && inputs.scenario !== 'operator' && inputs.scenario !== 'pragmatist' && (
              <TextField
                label="Segment"
                value={inputs.segment}
                onChange={(value) => onChange('segment', value)}
                error={errors.segment}
                placeholder="e.g. SMB Fintech"
              />
            )}
            <TextField
              label="Target geography"
              value={inputs.geo}
              onChange={(value) => onChange('geo', value)}
              error={errors.geo}
              placeholder="e.g. North America"
            />
            <div className="grid gap-4 md:grid-cols-2">
              <SelectField
                label="Timeframe"
                value={inputs.timeframe}
                onChange={(value) => onChange('timeframe', value)}
                options={timeframeOptions}
              />
              <div>
                <ToggleField
                  label="Use Google Search grounding"
                  description="Enrich sources with live web results."
                  enabled={inputs.useSearch}
                  onToggle={(value) => onChange('useSearch', value)}
                />
              </div>
            </div>
            <div>
              <span className="text-sm font-medium text-slate-700">Review mode</span>
              <div className="mt-2 grid gap-3 sm:grid-cols-2">
                {reviewModes.map((mode) => (
                  <label
                    key={mode.value}
                    className={cn(
                      'flex cursor-pointer items-start gap-3 rounded-lg border p-3 shadow-sm transition',
                      inputs.mode === mode.value
                        ? 'border-brand-500 bg-brand-50'
                        : 'border-slate-200 hover:border-slate-300'
                    )}
                  >
                    <input
                      type="radio"
                      name="review-mode"
                      value={mode.value}
                      checked={inputs.mode === mode.value}
                      onChange={() => onChange('mode', mode.value)}
                      className="mt-1 h-4 w-4 border-slate-300 text-brand-500 focus:ring-brand-500"
                    />
                    <div>
                      <p className="text-sm font-medium text-slate-900">{mode.label}</p>
                      <p className="text-xs text-slate-600">{mode.description}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </section>

          <section>{renderScenarioFields()}</section>

          {Object.values(errors).some(Boolean) && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              Fix the highlighted fields before continuing.
            </div>
          )}

          <div className="flex justify-end">
            <button
              type="button"
              onClick={onNext}
              className="inline-flex items-center rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2"
            >
              Continue to sources
            </button>
          </div>
        </div>

        <aside className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-900">What you’ll get</h3>
          <ul className="mt-3 space-y-3 text-sm text-slate-600">
            <li>
              <span className="font-medium text-slate-900">Pricing table:</span> Plans, list price, billing cadence, source links.
            </li>
            <li>
              <span className="font-medium text-slate-900">Feature matrix:</span> Capability coverage, differentiation notes, gaps.
            </li>
            <li>
              <span className="font-medium text-slate-900">Key claims:</span> 10–15 verified statements with confidence + citations.
            </li>
            <li>
              <span className="font-medium text-slate-900">Notion dataset:</span> Structured exports for projects, competitors, claims.
            </li>
            <li>
              <span className="font-medium text-slate-900">Brief:</span> Markdown ready for stakeholders (pricing, features, risks, sources).
            </li>
          </ul>
        </aside>
      </div>
    </div>
  );
}

interface TextFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string;
}

function TextField({ label, value, onChange, placeholder, error }: TextFieldProps) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-slate-700">{label}</label>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className={cn(
          'w-full rounded-lg border bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-500',
          error ? 'border-red-400' : 'border-slate-200 focus:border-brand-500'
        )}
      />
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}

interface TextareaFieldProps extends TextFieldProps {
  rows?: number;
}

function TextareaField({ label, value, onChange, placeholder, error, rows = 3 }: TextareaFieldProps) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-slate-700">{label}</label>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        rows={rows}
        className={cn(
          'w-full rounded-lg border bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-500',
          error ? 'border-red-400' : 'border-slate-200 focus:border-brand-500'
        )}
      />
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}

interface ToggleFieldProps {
  label: string;
  description?: string;
  enabled: boolean;
  onToggle: (value: boolean) => void;
}

function ToggleField({ label, description, enabled, onToggle }: ToggleFieldProps) {
  return (
    <button
      type="button"
      onClick={() => onToggle(!enabled)}
      className={cn(
        'flex w-full items-center justify-between rounded-lg border px-3 py-2 text-left text-sm shadow-sm transition',
        enabled ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-slate-200 bg-white hover:border-slate-300'
      )}
    >
      <div>
        <p className="font-medium">{label}</p>
        {description && <p className="text-xs text-slate-500">{description}</p>}
      </div>
      <span
        className={cn(
          'inline-flex h-5 w-10 items-center rounded-full border',
          enabled ? 'border-brand-500 bg-brand-500' : 'border-slate-300 bg-slate-200'
        )}
      >
        <span
          className={cn(
            'h-4 w-4 transform rounded-full bg-white shadow transition',
            enabled ? 'translate-x-5' : 'translate-x-1'
          )}
        />
      </span>
    </button>
  );
}

interface SelectFieldProps {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}

function SelectField({ label, value, options, onChange }: SelectFieldProps) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-slate-700">{label}</label>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  );
}
