import type { ScenarioInputs } from '../types';

const URL_REGEX = /^https?:\/\//i;

function uniqueDomains(urls: string[]): string[] {
  const domains = new Set<string>();
  urls.forEach((url) => {
    try {
      const hostname = new URL(url).hostname.replace(/^www\./, '');
      domains.add(hostname);
    } catch (error) {
      // ignore invalid URL parsing - validation will flag
    }
  });
  return Array.from(domains);
}

export function validateInputs(inputs: ScenarioInputs) {
  const errors: Record<string, string> = {};

  if (!inputs.projectName.trim()) {
    errors.projectName = 'Project name is required.';
  }
  if (!inputs.segment.trim() && inputs.scenario !== 'dreamer') {
    errors.segment = 'Segment is required.';
  }
  if (!inputs.geo.trim()) {
    errors.geo = 'Target geography is required.';
  }

  if (inputs.scenario === 'dreamer') {
    if (!inputs.ideaScope?.trim()) {
      errors.ideaScope = 'Describe the idea or business scope.';
    }
    if (!inputs.segment.trim()) {
      errors.segment = 'Add who you want to serve.';
    }
  }

  if (inputs.scenario === 'pragmatist') {
    if (!inputs.successMetrics?.trim()) {
      errors.successMetrics = 'Define success metrics so we can prioritise checks.';
    }
    const urlErrors = validateUrlList(inputs.competitorUrls, 3, 10);
    if (urlErrors) {
      errors.competitorUrls = urlErrors;
    }
  }

  if (inputs.scenario === 'operator') {
    if (!inputs.productUrl?.trim()) {
      errors.productUrl = 'Product URL is required.';
    } else if (!URL_REGEX.test(inputs.productUrl)) {
      errors.productUrl = 'Enter a valid https:// URL.';
    }
    const urlErrors = inputs.competitorUrls.length
      ? validateUrlList(inputs.competitorUrls, 1, 10)
      : undefined;
    if (urlErrors) {
      errors.competitorUrls = urlErrors;
    }
  }

  if (inputs.scenario === 'audit') {
    if (!inputs.productUrl?.trim()) {
      errors.productUrl = 'Site or app URL is required.';
    } else if (!URL_REGEX.test(inputs.productUrl)) {
      errors.productUrl = 'Enter a valid https:// URL.';
    }
    if (inputs.ga4OAuth && !inputs.ga4PropertyId) {
      errors.ga4PropertyId = 'Add the GA4 property ID to pair with the OAuth token.';
    }
    if (inputs.hotjarToken && !inputs.hotjarSiteId) {
      errors.hotjarSiteId = 'Include the Hotjar site ID when adding a token.';
    }
  }

  return errors;
}

export function validateUrlList(urls: string[], min: number, max: number) {
  if (!urls.length) {
    return `Add at least ${min} competitor URLs.`;
  }
  if (urls.length < min) {
    return `Need at least ${min} URLs to proceed.`;
  }
  if (urls.length > max) {
    return `Keep it to ${max} URLs for a manageable scope.`;
  }
  const invalid = urls.filter((url) => !URL_REGEX.test(url));
  if (invalid.length) {
    return `These URLs need https://: ${invalid.join(', ')}`;
  }
  const unique = uniqueDomains(urls);
  if (unique.length < Math.min(min, urls.length)) {
    return 'Provide unique domains—duplicates slow verification.';
  }
  return undefined;
}

export function isPaywalled(url: string) {
  try {
    const hostname = new URL(url).hostname;
    return /\b(wsj|ft|nytimes|theinformation|bloomberg|economist)\./i.test(hostname);
  } catch (error) {
    return false;
  }
}

export function normaliseUrl(url: string) {
  const trimmed = url.trim();
  if (!trimmed) return '';
  if (!/^https?:\/\//i.test(trimmed)) {
    return `https://${trimmed}`;
  }
  return trimmed;
}

export function getDomain(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch (error) {
    return url;
  }
}

export function computeConfidenceBuckets(confidences: number[]) {
  if (!confidences.length) {
    return { high: 0, medium: 0, low: 0 };
  }
  return confidences.reduce(
    (acc, value) => {
      if (value >= 0.85) {
        acc.high += 1;
      } else if (value >= 0.7) {
        acc.medium += 1;
      } else {
        acc.low += 1;
      }
      return acc;
    },
    { high: 0, medium: 0, low: 0 }
  );
}
