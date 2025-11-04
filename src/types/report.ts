import type { AdScoreConfig, DeviceProfileConfig } from './config.js';
import type { MeasurementRun } from './measurement.js';
import type { MetricComputationResult } from './metrics.js';

export interface MetricSummary {
  configId: string;
  weight: number;
  weightedScore: number;
  weightedMaxScore: number;
  result: MetricComputationResult;
}

export interface AdScoreReport {
  timestamp: number;
  config: AdScoreConfig;
  profile: DeviceProfileConfig;
  measurement: MeasurementRun;
  metrics: MetricSummary[];
  totalWeightedScore: number;
  totalWeightedMaxScore: number;
  totalScore: number; // 0-100 scale
}

export interface RunAdScoreAuditOptions {
  profileId?: 'desktop' | 'mobile';
  configOverrides?: import('./config.js').ConfigOverrides;
  measurement?: import('./measurement.js').ScrollCaptureOptions;
  debug?: boolean;
  consoleReport?: boolean;
  visualize?: boolean;
}

export interface AdScoreSummary {
  url: string;
  timestamp: number;
  profileId: string;
  totalScore: number;
  sampleCount: number;
  uniqueAdSlots: number;
  density?: {
    raw: number;
    score: number;
    stickyContributionArea?: number;
    stickySlotCount?: number;
    totalContentArea?: number;
  };
}
