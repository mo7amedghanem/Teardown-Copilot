export type ScenarioType = 'dreamer' | 'pragmatist' | 'operator' | 'audit';

export type ReviewMode = 'strict' | 'balanced';

export interface CommonInputs {
  projectName: string;
  segment: string;
  geo: string;
  timeframe: string;
  mode: ReviewMode;
  useSearch: boolean;
  weeklyRefresh: boolean;
}

export interface ScenarioInputs extends CommonInputs {
  scenario: ScenarioType;
  ideaScope?: string;
  productUrl?: string;
  competitorUrls: string[];
  knownCompetitors?: string;
  successMetrics?: string;
  budget?: string;
  ga4PropertyId?: string;
  ga4OAuth?: string;
  hotjarSiteId?: string;
  hotjarToken?: string;
}

export type JobStage =
  | 'idle'
  | 'sources'
  | 'fetching'
  | 'extracting'
  | 'verifying'
  | 'exporting'
  | 'complete'
  | 'error'
  | 'cancelled';

export interface ProgressCounts {
  sourcesFound: number;
  pagesFetched: number;
  claimsExtracted: number;
  claimsVerified: number;
  exportsGenerated: number;
}

export interface ProgressUpdate {
  stage: JobStage;
  counts: ProgressCounts;
  highlights: string[];
  coverageLow: boolean;
}

export interface Claim {
  id: string;
  text: string;
  topic: 'pricing' | 'features' | 'policy' | 'operations';
  confidence: number;
  groundedness: number;
  context: number;
  answerRelevance: number;
  sources: { url: string; snippet: string }[];
}

export interface TableRow {
  competitor: string;
  plan?: string;
  price?: string;
  features?: string[];
  notes?: string;
}

export interface ResultsPayload {
  competitors: { name: string; url: string; summary: string }[];
  claims: Claim[];
  tables: {
    pricing: TableRow[];
    features: TableRow[];
  };
  briefMarkdown: string;
  notionUrls: string[];
  coverageLow: boolean;
}

export interface RunResults {
  jobId: string;
  updates: ProgressUpdate[];
  results: ResultsPayload;
}

export interface BackendConfig {
  baseUrl?: string;
  notionExport: boolean;
}
