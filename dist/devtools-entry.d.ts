import { captureViewportSamples } from './measurement/scrollHarness.js';
import { runAdScoreAudit } from './runtime/runAudit.js';
import type { MeasurementRun, ScrollCaptureOptions } from './types/measurement.js';
import type { AdScoreReport, RunAdScoreAuditOptions } from './types/report.js';
import type { ConfigOverrides } from './types/config.js';
import { buildReportSummary } from './reporting/summary.js';
declare const GLOBAL_KEY = "__AD_SCORE_RUNTIME__";
declare function runMeasurement(options?: ScrollCaptureOptions): Promise<MeasurementRun>;
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
export { runMeasurement, captureViewportSamples, runAdScoreAudit };
//# sourceMappingURL=devtools-entry.d.ts.map