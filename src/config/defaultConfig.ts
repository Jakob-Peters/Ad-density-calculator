import { DEFAULT_AD_SELECTORS } from '../measurement/selectors.js';
import type {
  AdScoreConfig,
  CreateConfigOptions,
  DeviceProfileConfig,
  MetricConfig,
  RuntimeConfigContext
} from '../types/config.js';

const VERSION = '0.1.0';

const BASE_METRICS: AdScoreConfig['metrics'] = {
  adDensity: {
    id: 'adDensity',
    enabled: true,
    weight: 1,
    maxScore: 100,
    thresholds: {
      ideal: 0.25,
      caution: 0.55,
      fail: 0.85
    }
  },
  adCount: {
    id: 'adCount',
    enabled: false,
    weight: 0,
    maxScore: 0,
    thresholds: {
      ideal: 5,
      caution: 8,
      fail: 12
    }
  },
  contentDistance: {
    id: 'contentDistance',
    enabled: false,
    weight: 0,
    maxScore: 0,
    thresholds: {
      ideal: 600,
      caution: 360,
      fail: 180
    }
  },
  viewportCoverage: {
    id: 'viewportCoverage',
    enabled: false,
    weight: 0,
    maxScore: 0,
    thresholds: {
      ideal: 0.3,
      caution: 0.45,
      fail: 0.7
    }
  }
};

const BASE_PROFILES: Record<'desktop' | 'mobile', DeviceProfileConfig> = {
  desktop: {
    id: 'desktop',
    label: 'Desktop default',
    scroll: {
      delayMs: 1500,
      maxScrolls: 16,
      maxDurationMs: 120_000
    },
    metricWeights: {
      adDensity: 1
    }
  },
  mobile: {
    id: 'mobile',
    label: 'Mobile default',
    scroll: {
      delayMs: 1000,
      maxScrolls: 20,
      maxDurationMs: 140_000
    },
    metricWeights: {
      adDensity: 1
    }
  }
};

function cloneMetric(metric: MetricConfig): MetricConfig {
  return {
    ...metric,
    thresholds: { ...metric.thresholds }
  };
}

function deepMergeMetric(base: MetricConfig, override: Partial<MetricConfig>): MetricConfig {
  const merged = { ...base, ...override };
  if (override.thresholds) {
    merged.thresholds = {
      ...base.thresholds,
      ...override.thresholds
    };
  }
  return merged;
}

function deepMergeProfile(base: DeviceProfileConfig, override: Partial<DeviceProfileConfig>): DeviceProfileConfig {
  return {
    ...base,
    ...override,
    scroll: {
      ...base.scroll,
      ...override.scroll
    },
    metricWeights: {
      ...base.metricWeights,
      ...override.metricWeights
    }
  };
}

export function createConfig(options: CreateConfigOptions = {}): RuntimeConfigContext {
  const { overrides, profileId } = options;

  const metrics: AdScoreConfig['metrics'] = {
    adDensity: cloneMetric(BASE_METRICS.adDensity),
    adCount: cloneMetric(BASE_METRICS.adCount),
    contentDistance: cloneMetric(BASE_METRICS.contentDistance),
    viewportCoverage: cloneMetric(BASE_METRICS.viewportCoverage)
  };

  if (overrides?.metrics) {
    for (const key of Object.keys(overrides.metrics) as Array<keyof typeof metrics>) {
      const overrideConfig = overrides.metrics[key];
      if (!overrideConfig) continue;
      metrics[key] = deepMergeMetric(metrics[key], overrideConfig);
    }
  }

  const profiles: AdScoreConfig['profiles'] = {
    desktop: { ...BASE_PROFILES.desktop, scroll: { ...BASE_PROFILES.desktop.scroll }, metricWeights: { ...BASE_PROFILES.desktop.metricWeights } },
    mobile: { ...BASE_PROFILES.mobile, scroll: { ...BASE_PROFILES.mobile.scroll }, metricWeights: { ...BASE_PROFILES.mobile.metricWeights } }
  };

  if (overrides?.profiles) {
    for (const key of Object.keys(overrides.profiles) as Array<'desktop' | 'mobile'>) {
      const overrideProfile = overrides.profiles[key];
      if (!overrideProfile) continue;
      profiles[key] = deepMergeProfile(profiles[key], overrideProfile);
    }
  }

  const selectors = overrides?.selectors?.length ? overrides.selectors : [...DEFAULT_AD_SELECTORS];
  const defaultProfile = overrides?.defaultProfile ?? 'desktop';
  const selectedProfileId = profileId ?? defaultProfile;
  const profile = profiles[selectedProfileId];

  const config: AdScoreConfig = {
    version: VERSION,
    selectors,
    metrics,
    profiles,
    defaultProfile
  };

  return {
    config,
    profile
  };
}
