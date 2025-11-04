import type { MetricConfig, MetricKey } from './config.js';
import type { MeasurementRun } from './measurement.js';
export interface MetricComputationContext {
    config: MetricConfig;
    run: MeasurementRun;
}
export interface MetricComputationResult {
    id: MetricKey;
    rawValue: number;
    score: number;
    maxScore: number;
    normalizedScore: number;
    meta: Record<string, unknown>;
}
export type MetricComputer = (context: MetricComputationContext) => MetricComputationResult;
//# sourceMappingURL=metrics.d.ts.map