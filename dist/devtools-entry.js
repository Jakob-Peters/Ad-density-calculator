import { captureViewportSamples } from './measurement/scrollHarness.js';
import { runAdScoreAudit } from './runtime/runAudit.js';
import { buildReportSummary } from './reporting/summary.js';
const GLOBAL_KEY = '__AD_SCORE_RUNTIME__';
let storedConfigOverrides;
let storedMeasurementOverrides;
let lastReport = null;
let defaultVisualize = false;
const slotCacheKey = (slot) => `${slot.provider}::${slot.logicalId}`;
function collectUniqueSlots(samples) {
    const map = new Map();
    for (const sample of samples) {
        for (const slot of sample.adSlots) {
            map.set(slotCacheKey(slot), slot);
        }
    }
    return Array.from(map.values());
}
async function runMeasurement(options = {}) {
    return captureViewportSamples(options);
}
function mergeMeasurementOverrides(options) {
    if (!storedMeasurementOverrides && !options) {
        return options;
    }
    return {
        ...storedMeasurementOverrides,
        ...options
    };
}
async function runAuditWithState(options = {}) {
    const visualizeFlag = options.visualize ?? defaultVisualize;
    const baseMeasurement = mergeMeasurementOverrides(options.measurement);
    const measurementWithVisualization = visualizeFlag
        ? { ...(baseMeasurement ?? {}), visualizeDuringCapture: true }
        : baseMeasurement;
    const mergedOptions = {
        ...options,
        configOverrides: options.configOverrides ?? storedConfigOverrides,
        measurement: measurementWithVisualization,
        visualize: visualizeFlag
    };
    const report = await runAdScoreAudit(mergedOptions);
    lastReport = report;
    const overlayModule = await import('./visualization/overlay.js');
    if (visualizeFlag) {
        overlayModule.renderAdOverlays(collectUniqueSlots(report.measurement.samples));
    }
    else {
        overlayModule.clearAdOverlays();
    }
    return report;
}
async function renderOverlayFromLastReport(sampleIndex = 0) {
    if (!lastReport) {
        console.warn('[AdScore] No report available. Run runAudit() first.');
        return;
    }
    const overlayModule = await import('./visualization/overlay.js');
    if (typeof sampleIndex === 'number' && sampleIndex >= 0) {
        const sample = lastReport.measurement.samples[sampleIndex];
        if (!sample) {
            console.warn('[AdScore] Sample index out of range.');
            return;
        }
        overlayModule.renderAdOverlays(sample.adSlots);
    }
    else {
        overlayModule.renderAdOverlays(collectUniqueSlots(lastReport.measurement.samples));
    }
}
async function clearOverlay() {
    const overlayModule = await import('./visualization/overlay.js');
    overlayModule.clearAdOverlays();
}
function exposeToWindow(api) {
    if (typeof window === 'undefined') {
        return;
    }
    if (!(GLOBAL_KEY in window)) {
        Object.defineProperty(window, GLOBAL_KEY, {
            value: api,
            configurable: false,
            enumerable: false,
            writable: false
        });
    }
    window.runAdScoreMeasurement = api.runMeasurement;
    window.runAdScoreAudit = api.runAudit;
    window.adScore = api;
    if (typeof console !== 'undefined') {
        console.info('[AdScore] DevTools API exposed:', {
            measurement: 'window.runAdScoreMeasurement(options)',
            audit: 'window.runAdScoreAudit(options)',
            runtime: 'window.adScore'
        });
    }
}
const api = {
    runMeasurement,
    runAudit: runAuditWithState,
    setConfigOverrides: overrides => {
        storedConfigOverrides = overrides;
        console.info('[AdScore] Config overrides updated', overrides);
    },
    getConfigOverrides: () => storedConfigOverrides,
    setMeasurementDefaults: overrides => {
        storedMeasurementOverrides = overrides;
        console.info('[AdScore] Measurement defaults updated', overrides);
    },
    getMeasurementDefaults: () => storedMeasurementOverrides,
    getLastReport: () => lastReport,
    getLastSummary: () => (lastReport ? buildReportSummary(lastReport) : null),
    renderOverlay: renderOverlayFromLastReport,
    clearOverlay,
    setDefaultVisualize: value => {
        defaultVisualize = value;
        console.info('[AdScore] Default visualize set to', value);
    },
    version: '0.1.0'
};
exposeToWindow(api);
export { runMeasurement, captureViewportSamples, runAdScoreAudit };
//# sourceMappingURL=devtools-entry.js.map