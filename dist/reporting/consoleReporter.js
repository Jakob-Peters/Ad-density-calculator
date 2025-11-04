import { buildReportSummary } from './summary.js';
function formatPercent(value, decimals = 1) {
    return `${(value * 100).toFixed(decimals)}%`;
}
function formatScore(value, decimals = 1) {
    return value.toFixed(decimals);
}
export function renderConsoleReport(report) {
    const total = report.totalScore.toFixed(1);
    const header = `AdScore: ${total} / 100 (metrics: ${report.metrics.length})`;
    console.groupCollapsed(header);
    console.log('Profile:', report.profile.label, `(${report.profile.id})`);
    console.log('Measured samples:', report.measurement.samples.length);
    console.log('Selectors used:', report.config.selectors.join(', '));
    const summary = buildReportSummary(report);
    console.log('Summary:', {
        url: summary.url,
        score: `${summary.totalScore.toFixed(1)}`,
        samples: summary.sampleCount,
        uniqueSlots: summary.uniqueAdSlots,
        densityRaw: summary.density ? formatPercent(summary.density.raw) : 'n/a',
        stickySlots: summary.density?.stickySlotCount ?? 0
    });
    const tableData = report.metrics.map(metric => ({
        metric: metric.configId,
        score: formatScore(metric.result.score),
        weight: metric.weight.toFixed(2),
        weightedScore: formatScore(metric.weightedScore),
        raw: formatPercent(metric.result.rawValue)
    }));
    if (tableData.length > 0) {
        console.table(tableData);
    }
    else {
        console.log('No active metrics computed. Check configuration.');
    }
    console.log('Totals:', {
        totalWeightedScore: report.totalWeightedScore.toFixed(2),
        totalWeightedMaxScore: report.totalWeightedMaxScore.toFixed(2),
        totalScore: `${total}`
    });
    console.log('Export JSON:', JSON.stringify(summary));
    console.groupEnd();
}
//# sourceMappingURL=consoleReporter.js.map