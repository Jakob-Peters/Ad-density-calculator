export type AdTechProvider = 'gpt' | 'prebid' | 'adnami' | 'generic';

export interface NormalizedRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

export interface AdSlotSample {
  element: HTMLElement;
  id: string;
  logicalId: string;
  provider: AdTechProvider;
  slotName: string | null;
  dataset: Record<string, string>;
  boundingRect: NormalizedRect;
  visibleRect: NormalizedRect;
  surfaceArea: number;
  visibleArea: number;
  coverageRatio: number; // visible area / viewport area
  isVisible: boolean;
  isSticky: boolean;
}

export interface ViewportSample {
  index: number;
  timestamp: number;
  scrollY: number;
  viewport: {
    width: number;
    height: number;
  };
  adSlots: AdSlotSample[];
  totalAdArea: number;
  totalVisibleAdArea: number;
  totalContentArea: number;
}

export interface ScrollCaptureOptions {
  delayMs?: number;
  scrollStepPx?: number;
  maxScrolls?: number;
  maxDurationMs?: number;
  includeStickyDetection?: boolean;
  debug?: boolean;
  selectors?: string[];
  respectShadowDom?: boolean;
  restoreScrollPosition?: boolean;
  visualizeDuringCapture?: boolean;
}

export interface MeasurementRun {
  samples: ViewportSample[];
  metadata: {
    startedAt: number;
    finishedAt: number;
    totalDurationMs: number;
    initialScrollY: number;
    finalScrollY: number;
    scrollStepPx: number;
    delayMs: number;
    selectors: string[];
    maxScrolls: number | null;
    maxDurationMs: number | null;
  };
}
