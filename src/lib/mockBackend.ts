import dayjs from 'dayjs';
import type { Claim, ProgressUpdate, ResultsPayload, ScenarioInputs, TableRow } from '../types';

const globalScope = typeof globalThis !== 'undefined' ? (globalThis as Record<string, unknown>) : {};
const runtimeConfig = (globalScope.__TEARDOWN_CONFIG__ as { webhookBase?: string; notionExport?: boolean }) ?? {};
const nodeProcess = globalScope.process as { env?: Record<string, string | undefined> } | undefined;
const envVars = nodeProcess?.env ?? {};

const WEBHOOK_BASE = runtimeConfig.webhookBase ?? envVars.VITE_WEBHOOK_BASE ?? envVars.WEBHOOK_BASE;
const NOTION_EXPORT = Boolean(
  runtimeConfig.notionExport ?? (envVars.VITE_NOTION_EXPORT === 'true') ?? (envVars.NOTION_EXPORT === 'true')
);

const STAGES: ProgressUpdate['stage'][] = [
  'sources',
  'fetching',
  'extracting',
  'verifying',
  'exporting'
];

const FEATURE_SET = [
  'AI-powered pricing alerts',
  'Usage-based billing support',
  'Competitor launch timeline',
  'Workflow automation',
  'Governance dashboards',
  'API access'
];

const SAMPLE_SOURCES = [
  'https://www.pilotcompetitor.com/pricing',
  'https://news.ycombinator.com/item?id=123',
  'https://www.example.com/blog/product-update'
];

function randomPick<T>(items: T[], count: number): T[] {
  const copy = [...items];
  const picks: T[] = [];
  while (picks.length < count && copy.length) {
    const index = Math.floor(Math.random() * copy.length);
    picks.push(copy.splice(index, 1)[0]);
  }
  return picks;
}

function buildMockClaims(urls: string[], mode: ScenarioInputs['mode']): Claim[] {
  const baseClaims: Claim[] = Array.from({ length: 12 }, (_, idx) => {
    const topic = idx % 3 === 0 ? 'pricing' : idx % 3 === 1 ? 'features' : 'policy';
    const sources = randomPick(urls.length ? urls : SAMPLE_SOURCES, 2).map((url, sourceIdx) => ({
      url,
      snippet: `Snippet ${sourceIdx + 1} confirming claim ${idx + 1}`
    }));
    const groundedness = mode === 'strict' ? 0.92 : 0.86 + Math.random() * 0.1;
    const context = 0.82 + Math.random() * 0.12;
    const answerRelevance = 0.83 + Math.random() * 0.1;
    const confidence = Number(((groundedness + context + answerRelevance) / 3).toFixed(2));
    return {
      id: `claim-${idx + 1}`,
      text: `Claim ${idx + 1} lorem ipsum dolor sit amet with actionable insight`,
      topic,
      confidence,
      groundedness: Number(groundedness.toFixed(2)),
      context: Number(context.toFixed(2)),
      answerRelevance: Number(answerRelevance.toFixed(2)),
      sources
    };
  });
  return baseClaims;
}

function buildPricingTable(urls: string[]): TableRow[] {
  const rows: TableRow[] = urls.slice(0, 4).map((url, idx) => ({
    competitor: new URL(url).hostname.replace('www.', ''),
    plan: idx % 2 === 0 ? 'Growth' : 'Enterprise',
    price: idx % 2 === 0 ? `$${99 + idx * 50}/mo` : 'Custom',
    notes: 'Anchored from verified sources'
  }));
  if (!rows.length) {
    rows.push({
      competitor: 'sample-competitor.com',
      plan: 'Standard',
      price: '$149/mo',
      notes: 'Mock data for demo'
    });
  }
  return rows;
}

function buildFeatureMatrix(urls: string[]): TableRow[] {
  const rows: TableRow[] = urls.slice(0, 4).map((url, idx) => ({
    competitor: new URL(url).hostname.replace('www.', ''),
    features: randomPick(FEATURE_SET, 3 + (idx % 2)),
    notes: 'Feature coverage derived from verified claims'
  }));
  if (!rows.length) {
    rows.push({
      competitor: 'sample-competitor.com',
      features: randomPick(FEATURE_SET, 3),
      notes: 'Mock data for demo'
    });
  }
  return rows;
}

function buildMarkdownBrief(inputs: ScenarioInputs, pricing: TableRow[], features: TableRow[], claims: Claim[]): string {
  const header = `# ${inputs.projectName}\n\n`;
  const meta = `- **Segment:** ${inputs.segment}\n- **Geo:** ${inputs.geo}\n- **Mode:** ${inputs.mode}\n- **Timeframe:** ${inputs.timeframe}\n- **Updated:** ${dayjs().format('MMM D, YYYY')}\n\n`;
  const pricingSection = `## Pricing Summary\n${pricing
    .map((row) => `- ${row.competitor}: ${row.plan ?? 'N/A'} — ${row.price ?? 'N/A'}`)
    .join('\n')}\n\n`;
  const featureSection = `## Feature Matrix Highlights\n${features
    .map((row) => `- ${row.competitor}: ${row.features?.join(', ') ?? 'N/A'}`)
    .join('\n')}\n\n`;
  const claimsSection = `## Key Claims\n${claims
    .slice(0, 12)
    .map((claim) => `- (${claim.confidence * 100}% conf.) ${claim.text}`)
    .join('\n')}\n\n`;
  const risksSection = `## Risks & Gaps\n- Coverage low flag: ${claims.length < 10 ? 'Yes' : 'No'}\n- Pricing clarity: ${pricing.length ? 'Met' : 'Missing'}\n\n`;
  const sourcesSection = `## Sources\n${Array.from(
    new Set(claims.flatMap((claim) => claim.sources.map((source) => source.url)))
  )
    .map((url) => `- ${url}`)
    .join('\n')}\n`;
  return header + meta + pricingSection + featureSection + claimsSection + risksSection + sourcesSection;
}

function mockResults(inputs: ScenarioInputs): ResultsPayload {
  const urls = inputs.competitorUrls.length ? inputs.competitorUrls : SAMPLE_SOURCES;
  const claims = buildMockClaims(urls, inputs.mode);
  const pricing = buildPricingTable(urls);
  const features = buildFeatureMatrix(urls);
  const coverageLow = claims.length < 10 || !pricing.length;
  return {
    competitors: urls.slice(0, 5).map((url) => ({
      name: new URL(url).hostname.replace('www.', ''),
      url,
      summary: 'Auto-generated summary based on verified claims.'
    })),
    claims,
    tables: {
      pricing,
      features
    },
    briefMarkdown: buildMarkdownBrief(inputs, pricing, features, claims),
    notionUrls: [],
    coverageLow
  };
}

export async function runAnalysis(
  inputs: ScenarioInputs,
  onUpdate: (update: ProgressUpdate) => void,
  signal?: AbortSignal
): Promise<ResultsPayload> {
  const stages = [...STAGES];
  const counts = {
    sourcesFound: 0,
    pagesFetched: 0,
    claimsExtracted: 0,
    claimsVerified: 0,
    exportsGenerated: 0
  };

  for (const [index, stage] of stages.entries()) {
    if (signal?.aborted) {
      throw new DOMException('Aborted', 'AbortError');
    }
    await new Promise((resolve) => setTimeout(resolve, 900));
    switch (stage) {
      case 'sources':
        counts.sourcesFound = Math.max(inputs.competitorUrls.length, 3);
        break;
      case 'fetching':
        counts.pagesFetched = counts.sourcesFound * 3;
        break;
      case 'extracting':
        counts.claimsExtracted = counts.pagesFetched * 2;
        break;
      case 'verifying':
        counts.claimsVerified = Math.round(counts.claimsExtracted * (inputs.mode === 'strict' ? 0.65 : 0.75));
        break;
      case 'exporting':
        counts.exportsGenerated = 2;
        break;
      default:
        break;
    }
    const highlights = [`Stage ${index + 1}: ${stage} completed`];
    onUpdate({
      stage,
      counts: { ...counts },
      highlights,
      coverageLow: false
    });
  }

  const results = mockResults(inputs);
  onUpdate({
    stage: 'complete',
    counts: { ...counts },
    highlights: ['Analysis complete. Results ready.'],
    coverageLow: results.coverageLow
  });
  return results;
}

export function getBackendConfig() {
  return {
    baseUrl: WEBHOOK_BASE,
    notionExport: NOTION_EXPORT
  };
}

export async function scheduleWeeklyRefresh(projectName: string, enable: boolean) {
  if (!WEBHOOK_BASE) {
    await new Promise((resolve) => setTimeout(resolve, 400));
    return { status: enable ? 'scheduled' : 'cancelled' };
  }
  const response = await fetch(`${WEBHOOK_BASE}/webhook/schedule_refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ project: projectName, cadence: enable ? 'weekly' : 'off' })
  });
  if (!response.ok) {
    throw new Error('Failed to schedule refresh');
  }
  return response.json();
}
