import type { AdSlotSample } from '../types/measurement.js';
export interface OverlayOptions {
    palette?: string[];
    opacity?: number;
    showLabels?: boolean;
}
export declare function clearAdOverlays(): void;
export declare function renderAdOverlays(slots: AdSlotSample[], options?: OverlayOptions): void;
//# sourceMappingURL=overlay.d.ts.map