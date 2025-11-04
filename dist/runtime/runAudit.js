import { createConfig } from '../config/index.js';
import { captureViewportSamples } from '../measurement/scrollHarness.js';
import { computeAdDensity } from '../metrics/adDensity.js';
const METRIC_COMPUTERS = {
    adDensity: computeAdDensity
};
function selectMetricComputer(metricId) {
    const computer = METRIC_COMPUTERS[metricId];
    return computer ?? null;
}
async function performMeasurement(selectors, profileScrollOptions, overrides, debugFlag) {
    const merged = {
        ...profileScrollOptions,
        selectors,
        includeStickyDetection: overrides?.includeStickyDetection ?? true,
        restoreScrollPosition: overrides?.restoreScrollPosition ?? true,
        respectShadowDom: overrides?.respectShadowDom ?? false
    };
    if (overrides) {
        if (typeof overrides.delayMs === 'number')
            merged.delayMs = overrides.delayMs;
        if (typeof overrides.scrollStepPx === 'number')
            merged.scrollStepPx = overrides.scrollStepPx;
        if (typeof overrides.maxScrolls === 'number')
            merged.maxScrolls = overrides.maxScrolls;
        if (typeof overrides.maxDurationMs === 'number')
            merged.maxDurationMs = overrides.maxDurationMs;
        if (typeof overrides.includeStickyDetection === 'boolean') {
            merged.includeStickyDetection = overrides.includeStickyDetection;
        }
        if (typeof overrides.restoreScrollPosition === 'boolean') {
            merged.restoreScrollPosition = overrides.restoreScrollPosition;
        }
        if (typeof overrides.respectShadowDom === 'boolean') {
            merged.respectShadowDom = overrides.respectShadowDom;
        }
    }
    const debugValue = typeof debugFlag === 'boolean' ? debugFlag : overrides?.debug;
    if (typeof debugValue === 'boolean') {
        merged.debug = debugValue;
    }
    return captureViewportSamples(merged);
}
function aggregateMetrics(options) {
    const { measurement, config, profile } = options;
    const summaries = [];
    for (const metricId of Object.keys(config.metrics)) {
        const metricConfig = config.metrics[metricId];
        const computer = selectMetricComputer(metricId);
        if (!metricConfig.enabled || !computer) {
            continue;
        }
        const weight = profile.metricWeights[metricConfig.id] ?? metricConfig.weight ?? 0;
        if (weight <= 0 || metricConfig.maxScore <= 0) {
            continue;
        }
        const result = computer({
            config: metricConfig,
            run: measurement
        });
        summaries.push({
            configId: metricConfig.id,
            weight,
            weightedScore: result.score * weight,
            weightedMaxScore: metricConfig.maxScore * weight,
            result
        });
    }
    return summaries;
}
function computeTotals(summaries) {
    const totalWeightedScore = summaries.reduce((sum, metric) => sum + metric.weightedScore, 0);
    const totalWeightedMaxScore = summaries.reduce((sum, metric) => sum + metric.weightedMaxScore, 0);
    const totalScore = totalWeightedMaxScore > 0 ? (totalWeightedScore / totalWeightedMaxScore) * 100 : 0;
    return {
        totalWeightedScore,
        totalWeightedMaxScore,
        totalScore
    };
}
export async function runAdScoreAudit(options = {}) {
    const { profileId, configOverrides, measurement: measurementOverrides, debug, consoleReport, visualize } = options;
    const createConfigOptions = {};
    if (configOverrides) {
        createConfigOptions.overrides = configOverrides;
    }
    if (profileId) {
        createConfigOptions.profileId = profileId;
    }
    const { config, profile } = createConfig(createConfigOptions);
    if (debug) {
        console.debug('[AdScore] Using profile', profile);
        console.debug('[AdScore] Config selectors', config.selectors);
    }
    const measurement = await performMeasurement(config.selectors, profile.scroll, measurementOverrides, debug);
    const summaries = aggregateMetrics({ measurement, config, profile });
    const totals = computeTotals(summaries);
    const report = {
        timestamp: Date.now(),
        config,
        profile,
        measurement,
        metrics: summaries,
        ...totals
    };
    if (typeof visualize === 'boolean') {
        try {
            const overlayModule = await import('../visualization/overlay.js');
            if (visualize) {
                const firstSample = report.measurement.samples[0];
                if (firstSample) {
                    overlayModule.renderAdOverlays(firstSample.adSlots);
                }
            }
            else {
                overlayModule.clearAdOverlays();
            }
        }
        catch (error) {
            console.warn('[AdScore] Failed to toggle overlay', error);
        }
    }
    if (consoleReport) {
        try {
            const { renderConsoleReport } = await import('../reporting/consoleReporter.js');
            renderConsoleReport(report);
        }
        catch (error) {
            console.warn('[AdScore] Failed to render console report', error);
        }
    }
    return report;
}
//# sourceMappingURL=runAudit.js.map