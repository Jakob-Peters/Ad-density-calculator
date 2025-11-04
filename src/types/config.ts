import type { ScrollCaptureOptions } from './measurement.js';

export type MetricKey = 'adDensity' | 'adCount' | 'contentDistance' | 'viewportCoverage';

export interface MetricThresholds {
  // Raw metric value considered ideal/best-case (score should max out here)
  ideal: number;
  // Raw metric value where score starts decaying (midpoint)
  caution: number;
  // Raw metric value considered worst-case (score hits zero here)
  fail: number;
}

export interface MetricConfig {
  id: MetricKey;
  enabled: boolean;
  weight: number;
  maxScore: number;
  thresholds: MetricThresholds;
}

export interface DeviceProfileConfig {
  id: 'desktop' | 'mobile';
  label: string;
  scroll: Pick<ScrollCaptureOptions, 'delayMs' | 'scrollStepPx' | 'maxScrolls' | 'maxDurationMs'>;
  metricWeights: Partial<Record<MetricKey, number>>;
}

export interface AdScoreConfig {
  version: string;
  selectors: string[];
  metrics: Record<MetricKey, MetricConfig>;
  profiles: Record<'desktop' | 'mobile', DeviceProfileConfig>;
  defaultProfile: 'desktop' | 'mobile';
}

export interface ConfigOverrides {
  selectors?: string[];
  metrics?: Partial<Record<MetricKey, Partial<MetricConfig>>>;
  profiles?: Partial<Record<'desktop' | 'mobile', Partial<DeviceProfileConfig>>>;
  defaultProfile?: 'desktop' | 'mobile';
}

export interface RuntimeConfigContext {
  config: AdScoreConfig;
  profile: DeviceProfileConfig;
}

export interface CreateConfigOptions {
  overrides?: ConfigOverrides;
  profileId?: 'desktop' | 'mobile';
}
