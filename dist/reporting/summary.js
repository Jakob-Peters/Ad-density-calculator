export function buildReportSummary(report) {
    const densityMetric = report.metrics.find(metric => metric.configId === 'adDensity');
    const summary = {
        url: typeof window !== 'undefined' ? window.location.href : 'unknown',
        timestamp: report.timestamp,
        profileId: report.profile.id,
        totalScore: report.totalScore,
        sampleCount: report.measurement.samples.length,
        uniqueAdSlots: countUniqueSlots(report)
    };
    if (densityMetric) {
        const meta = densityMetric.result.meta;
        const density = {
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
function countUniqueSlots(report) {
    const uniqueIds = new Set();
    for (const sample of report.measurement.samples) {
        for (const slot of sample.adSlots) {
            uniqueIds.add(`${slot.provider}::${slot.logicalId}`);
        }
    }
    return uniqueIds.size;
}
//# sourceMappingURL=summary.js.map