import { useCallback, useMemo, useState } from 'react';
import { ScenarioForm } from './components/ScenarioForm';
import { SourceItem, SourceReview, mapUrlsToSources } from './components/SourceReview';
import { RunProgress } from './components/RunProgress';
import { ResultsView } from './components/ResultsView';
import { AnalysisStatsBar } from './components/AnalysisStatsBar';
import { getBackendConfig, runAnalysis } from './lib/mockBackend';
import { computeConfidenceBuckets, validateInputs } from './lib/validation';
import type { ProgressUpdate, ScenarioInputs } from './types';

const defaultInputs: ScenarioInputs = {
  scenario: 'dreamer',
  projectName: '',
  segment: '',
  geo: '',
  timeframe: '6-12 months',
  mode: 'strict',
  useSearch: false,
  weeklyRefresh: false,
  ideaScope: '',
  productUrl: '',
  competitorUrls: [],
  knownCompetitors: '',
  successMetrics: '',
  budget: '',
  ga4PropertyId: '',
  ga4OAuth: '',
  hotjarSiteId: '',
  hotjarToken: ''
};

type Step = 1 | 2 | 3 | 4;

type RunState = {
  updates: ProgressUpdate[];
  stage: ProgressUpdate['stage'];
  resultsAvailable: boolean;
  error: string | null;
  abortController: AbortController | null;
};

const backendConfig = getBackendConfig();

export default function App() {
  const [inputs, setInputs] = useState<ScenarioInputs>(defaultInputs);
  const [step, setStep] = useState<Step>(1);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [sources, setSources] = useState<SourceItem[]>([]);
  const [runState, setRunState] = useState<RunState>({
    updates: [],
    stage: 'idle',
    resultsAvailable: false,
    error: null,
    abortController: null
  });
  const [resultsValue, setResultsValue] = useState<ReturnType<typeof runAnalysis> extends Promise<infer R> ? R : never>();

  const acceptedClaims = useMemo(() => {
    if (!resultsValue) {
      const latest = runState.updates[runState.updates.length - 1];
      return latest?.counts.claimsVerified ?? 0;
    }
    return resultsValue.claims.filter((claim) => claim.confidence >= (inputs.mode === 'strict' ? 0.85 : 0.75)).length;
  }, [inputs.mode, resultsValue, runState.updates]);

  const handleInputChange = useCallback(<K extends keyof ScenarioInputs>(key: K, value: ScenarioInputs[K]) => {
    setInputs((prev) => ({
      ...prev,
      [key]: value
    }));
  }, []);

  const handleNextFromScenario = () => {
    const validation = validateInputs({ ...inputs, competitorUrls: inputs.competitorUrls });
    setErrors(validation);
    if (Object.values(validation).some(Boolean)) {
      return;
    }
    let initialSources = inputs.competitorUrls;
    if (!initialSources.length && inputs.scenario === 'dreamer') {
      initialSources = generateSuggestions(inputs);
    }
    if (!initialSources.length && inputs.productUrl) {
      initialSources = [inputs.productUrl];
    }
    const mapped = mapUrlsToSources(initialSources);
    setSources(mapped);
    setInputs((prev) => ({ ...prev, competitorUrls: initialSources }));
    setStep(2);
  };

  const handleSourcesChange = (updated: SourceItem[]) => {
    setSources(updated);
    setInputs((prev) => ({ ...prev, competitorUrls: updated.map((source) => source.url) }));
  };

  const startRun = async () => {
    const abortController = new AbortController();
    setRunState({
      stage: 'sources',
      updates: [],
      resultsAvailable: false,
      error: null,
      abortController
    });
    setStep(3);
    try {
      const payload = await runAnalysis(
        { ...inputs, competitorUrls: sources.map((source) => source.url) },
        (update) => {
          setRunState((prev) => ({
            ...prev,
            stage: update.stage,
            updates: [...prev.updates, update]
          }));
        },
        abortController.signal
      );
      setRunState((prev) => ({ ...prev, stage: 'complete', resultsAvailable: true, abortController: null }));
      setResultsValue(payload);
      setStep(4);
    } catch (error) {
      if ((error as DOMException).name === 'AbortError') {
        setRunState((prev) => ({ ...prev, stage: 'cancelled', error: 'Run cancelled', abortController: null }));
        return;
      }
      setRunState((prev) => ({ ...prev, stage: 'error', error: 'Run failed. Try again.', abortController: null }));
    }
  };

  const cancelRun = () => {
    runState.abortController?.abort();
  };

  const retryRun = () => {
    startRun();
  };

  const editSources = () => {
    if (runState.abortController) {
      runState.abortController.abort();
    }
    setRunState({ updates: [], stage: 'idle', resultsAvailable: false, error: null, abortController: null });
    setStep(2);
  };

  const restartWorkflow = () => {
    setInputs(defaultInputs);
    setSources([]);
    setRunState({ updates: [], stage: 'idle', resultsAvailable: false, error: null, abortController: null });
    setResultsValue(undefined);
    setStep(1);
  };

  const stageConfidence = resultsValue
    ? computeConfidenceBuckets(resultsValue.claims.map((claim) => claim.confidence))
    : { high: 0, medium: 0, low: 0 };

  const sourceCount = useMemo(() => {
    if (step === 2) return sources.length;
    if (resultsValue) return resultsValue.competitors.length;
    const latest = runState.updates[runState.updates.length - 1];
    return latest?.counts.sourcesFound ?? inputs.competitorUrls.length;
  }, [inputs.competitorUrls.length, resultsValue, runState.updates, sources.length, step]);

  return (
    <div className="min-h-screen bg-slate-50">
      <AnalysisStatsBar
        step={step}
        sources={sourceCount}
        acceptedClaims={acceptedClaims}
        confidence={stageConfidence}
      />
      <main className="mx-auto max-w-6xl px-6 pb-16">
        {step === 1 && (
          <ScenarioForm inputs={inputs} errors={errors} onChange={handleInputChange} onNext={handleNextFromScenario} />
        )}
        {step === 2 && (
          <SourceReview
            scenario={inputs.scenario}
            sources={sources}
            onSourcesChange={handleSourcesChange}
            onBack={() => setStep(1)}
            onContinue={startRun}
            allowSkip={inputs.scenario === 'dreamer'}
          />
        )}
        {step === 3 && (
          <RunProgress
            mode={inputs.mode}
            stage={runState.stage}
            updates={runState.updates}
            isRunning={runState.stage !== 'error' && runState.stage !== 'cancelled' && runState.stage !== 'complete'}
            onCancel={cancelRun}
            onRetry={retryRun}
            onEditSources={editSources}
            error={runState.error}
          />
        )}
        {step === 4 && resultsValue && (
          <ResultsView
            projectName={inputs.projectName}
            scenario={inputs.scenario}
            mode={inputs.mode}
            results={resultsValue}
            notionEnabled={backendConfig.notionExport}
            onRestart={restartWorkflow}
          />
        )}
      </main>
    </div>
  );
}

function generateSuggestions(inputs: ScenarioInputs) {
  const base = inputs.ideaScope?.toLowerCase().replace(/[^a-z0-9]+/g, '').slice(0, 12) || 'scope';
  const geo = inputs.geo?.split(' ')[0]?.toLowerCase().replace(/[^a-z0-9]+/g, '') || 'global';
  return [
    `https://${base}-benchmark.${geo}.example.com`,
    `https://${base}-leader.${geo}.example.com`,
    `https://${geo}${base}.producthunt.com`
  ];
}

