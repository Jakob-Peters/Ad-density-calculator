export { captureViewportSamples } from './measurement/scrollHarness.js';
export { collectAdSlotSamples } from './measurement/adCollector.js';
export { runAdScoreAudit } from './runtime/runAudit.js';
export type {
  AdSlotSample,
  AdTechProvider,
  MeasurementRun,
  NormalizedRect,
  ScrollCaptureOptions,
  ViewportSample
} from './types/measurement.js';
export type { RunAdScoreAuditOptions, AdScoreReport } from './types/report.js';
