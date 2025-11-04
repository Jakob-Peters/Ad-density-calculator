import { captureViewportSamples } from './measurement/scrollHarness.js';
import { runAdScoreAudit } from './runtime/runAudit.js';
import type { AdSlotSample, MeasurementRun, ScrollCaptureOptions, ViewportSample } from './types/measurement.js';
import type { AdScoreReport, RunAdScoreAuditOptions } from './types/report.js';
import type { ConfigOverrides } from './types/config.js';
import { buildReportSummary } from './reporting/summary.js';

const GLOBAL_KEY = '__AD_SCORE_RUNTIME__';

let storedConfigOverrides: ConfigOverrides | undefined;
let storedMeasurementOverrides: ScrollCaptureOptions | undefined;
let lastReport: AdScoreReport | null = null;
let defaultVisualize = false;

const slotCacheKey = (slot: AdSlotSample) => `${slot.provider}::${slot.logicalId}`;

function collectUniqueSlots(samples: ViewportSample[]): AdSlotSample[] {
  const map = new Map<string, AdSlotSample>();
  for (const sample of samples) {
    for (const slot of sample.adSlots) {
      map.set(slotCacheKey(slot), slot);
    }
  }
  return Array.from(map.values());
}

async function runMeasurement(options: ScrollCaptureOptions = {}): Promise<MeasurementRun> {
  return captureViewportSamples(options);
}

function mergeMeasurementOverrides(options?: ScrollCaptureOptions): ScrollCaptureOptions | undefined {
  if (!storedMeasurementOverrides && !options) {
    return options;
  }
  return {
    ...storedMeasurementOverrides,
    ...options
  };
}

async function runAuditWithState(options: RunAdScoreAuditOptions = {}): Promise<AdScoreReport> {
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
  } as RunAdScoreAuditOptions;

  const report = await runAdScoreAudit(mergedOptions);
  lastReport = report;
  const overlayModule = await import('./visualization/overlay.js');
  if (visualizeFlag) {
    overlayModule.renderAdOverlays(collectUniqueSlots(report.measurement.samples));
  } else {
    overlayModule.clearAdOverlays();
  }
  return report;
}

async function renderOverlayFromLastReport(sampleIndex = 0): Promise<void> {
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
  } else {
    overlayModule.renderAdOverlays(collectUniqueSlots(lastReport.measurement.samples));
  }
}

async function clearOverlay(): Promise<void> {
  const overlayModule = await import('./visualization/overlay.js');
  overlayModule.clearAdOverlays();
}

type DevToolsAPI = {
  runMeasurement: (options?: ScrollCaptureOptions) => Promise<MeasurementRun>;
  runAudit: (options?: RunAdScoreAuditOptions) => Promise<AdScoreReport>;
  setConfigOverrides: (overrides?: ConfigOverrides) => void;
  getConfigOverrides: () => ConfigOverrides | undefined;
  setMeasurementDefaults: (overrides?: ScrollCaptureOptions) => void;
  getMeasurementDefaults: () => ScrollCaptureOptions | undefined;
  getLastReport: () => AdScoreReport | null;
  getLastSummary: () => ReturnType<typeof buildReportSummary> | null;
  renderOverlay: (sampleIndex?: number) => Promise<void>;
  clearOverlay: () => Promise<void>;
  setDefaultVisualize: (value: boolean) => void;
  version: string;
};

declare global {
  interface Window {
    [GLOBAL_KEY]?: DevToolsAPI;
    runAdScoreMeasurement?: (options?: ScrollCaptureOptions) => Promise<MeasurementRun>;
    runAdScoreAudit?: (options?: RunAdScoreAuditOptions) => Promise<AdScoreReport>;
    adScore?: DevToolsAPI;
  }
}

function exposeToWindow(api: DevToolsAPI) {
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

const api: DevToolsAPI = {
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
