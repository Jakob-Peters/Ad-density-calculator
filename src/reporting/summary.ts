import type { AdScoreReport, AdScoreSummary } from '../types/report.js';

export function buildReportSummary(report: AdScoreReport): AdScoreSummary {
  const densityMetric = report.metrics.find(metric => metric.configId === 'adDensity');
  const summary: AdScoreSummary = {
    url: typeof window !== 'undefined' ? window.location.href : 'unknown',
    timestamp: report.timestamp,
    profileId: report.profile.id,
    totalScore: report.totalScore,
    sampleCount: report.measurement.samples.length,
    uniqueAdSlots: countUniqueSlots(report)
  };

  if (densityMetric) {
    const meta = densityMetric.result.meta as Record<string, unknown> | undefined;
    const density: NonNullable<AdScoreSummary['density']> = {
      raw: densityMetric.result.rawValue,
      score: densityMetric.result.score
    };

    if (typeof meta?.stickyContributionArea === 'number') {
      density.stickyContributionArea = meta.stickyContributionArea;
    }
    if (typeof meta?.stickySlotCount === 'number') {
      density.stickySlotCount = meta.stickySlotCount;
    }
    if (typeof meta?.totalContentArea === 'number') {
      density.totalContentArea = meta.totalContentArea;
    }

    summary.density = density;
  }

  return summary;
}

function countUniqueSlots(report: AdScoreReport): number {
  const uniqueIds = new Set<string>();
  for (const sample of report.measurement.samples) {
    for (const slot of sample.adSlots) {
      uniqueIds.add(`${slot.provider}::${slot.logicalId}`);
    }
  }
  return uniqueIds.size;
}
