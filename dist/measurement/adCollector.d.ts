import type { AdSlotSample, ScrollCaptureOptions } from '../types/measurement.js';
export interface CollectAdSlotsOptions {
    selectors?: string[];
    includeStickyDetection?: boolean;
}
export declare function collectAdSlotSamples(options?: CollectAdSlotsOptions): AdSlotSample[];
export declare function getEffectiveSelectors(options?: ScrollCaptureOptions): string[];
//# sourceMappingURL=adCollector.d.ts.map