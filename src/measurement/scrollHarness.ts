import { collectAdSlotSamples, getEffectiveSelectors } from './adCollector.js';
import type { AdSlotSample, MeasurementRun, ScrollCaptureOptions, ViewportSample } from '../types/measurement.js';
import { renderAdOverlays, clearAdOverlays } from '../visualization/overlay.js';

const DEFAULT_DELAY_MS = 1500;
const MIN_DELAY_MS = 100;
const DEFAULT_SCROLL_STEP = () => window.innerHeight;

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, Math.max(ms, 0)));
}

function getDocumentHeight(): number {
  return Math.max(
    document.body?.scrollHeight ?? 0,
    document.documentElement?.scrollHeight ?? 0,
    document.body?.offsetHeight ?? 0,
    document.documentElement?.offsetHeight ?? 0,
    document.body?.clientHeight ?? 0,
    document.documentElement?.clientHeight ?? 0
  );
}

function isAtBottom(): boolean {
  const scrollTop = window.scrollY || window.pageYOffset;
  return scrollTop + window.innerHeight >= getDocumentHeight() - 2;
}

interface SanitizedOptions {
  delayMs: number;
  scrollStepPx: number;
  maxScrolls: number;
  maxDurationMs: number;
  includeStickyDetection: boolean;
  debug: boolean;
  respectShadowDom: boolean;
  restoreScrollPosition: boolean;
  visualizeDuringCapture: boolean;
}

function sanitizeOptions(options: ScrollCaptureOptions = {}): SanitizedOptions {
  const delayMs = Math.max(options.delayMs ?? DEFAULT_DELAY_MS, MIN_DELAY_MS);
  const scrollStepPx = options.scrollStepPx ?? DEFAULT_SCROLL_STEP();
  const maxScrolls = options.maxScrolls ?? Number.POSITIVE_INFINITY;
  const maxDurationMs = options.maxDurationMs ?? Number.POSITIVE_INFINITY;
  const includeStickyDetection = options.includeStickyDetection ?? true;
  const debug = options.debug ?? false;
  const respectShadowDom = options.respectShadowDom ?? false;
  const restoreScrollPosition = options.restoreScrollPosition ?? true;
  const visualizeDuringCapture = options.visualizeDuringCapture ?? false;

  return {
    delayMs,
    scrollStepPx: Math.max(scrollStepPx, 0),
    maxScrolls,
    maxDurationMs,
    includeStickyDetection,
    debug,
    respectShadowDom,
    restoreScrollPosition,
    visualizeDuringCapture
  };
}

function buildViewportSample(index: number, selectors: string[], includeStickyDetection: boolean): ViewportSample {
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const viewportArea = viewportWidth * viewportHeight;

  const adSlots = collectAdSlotSamples({
    selectors,
    includeStickyDetection
  });
  const totalVisibleAdArea = adSlots.reduce((sum, slot) => sum + slot.visibleArea, 0);
  const totalAdArea = adSlots.reduce((sum, slot) => sum + slot.surfaceArea, 0);

  return {
    index,
    timestamp: Date.now(),
    scrollY: window.scrollY || window.pageYOffset,
    viewport: {
      width: viewportWidth,
      height: viewportHeight
    },
    adSlots,
    totalAdArea,
    totalVisibleAdArea,
    totalContentArea: viewportArea
  };
}

export async function captureViewportSamples(options: ScrollCaptureOptions = {}): Promise<MeasurementRun> {
  const sanitized = sanitizeOptions(options);
  const selectors = getEffectiveSelectors(options);

  const originalScrollY = window.scrollY || window.pageYOffset;
  const startedAt = Date.now();
  const samples: ViewportSample[] = [];

  let didSetCustomSelectors = false;
  if (options?.selectors && options.selectors.length > 0) {
    didSetCustomSelectors = true;
  }

  try {
    let index = 0;
    const startHighRes = typeof performance !== 'undefined' ? performance.now() : Date.now();

    const aggregateSlots = new Map<string, AdSlotSample>();

    const makeSlotKey = (slot: AdSlotSample) => `${slot.provider}::${slot.logicalId}`;

    while (index < sanitized.maxScrolls) {
      if (sanitized.debug) {
        console.debug('[captureViewportSamples] Sampling viewport', { index, scrollY: window.scrollY });
      }

      const sample = buildViewportSample(index, selectors, sanitized.includeStickyDetection);
      samples.push(sample);

      if (sanitized.visualizeDuringCapture) {
        for (const slot of sample.adSlots) {
          aggregateSlots.set(makeSlotKey(slot), slot);
        }
        renderAdOverlays(Array.from(aggregateSlots.values()));
      }

      const elapsed = (typeof performance !== 'undefined' ? performance.now() : Date.now()) - startHighRes;
      if (elapsed > sanitized.maxDurationMs) {
        if (sanitized.debug) {
          console.debug('[captureViewportSamples] Stopping due to maxDurationMs threshold');
        }
        break;
      }

      if (isAtBottom()) {
        if (sanitized.debug) {
          console.debug('[captureViewportSamples] Reached bottom of page');
        }
        break;
      }

      if (sanitized.scrollStepPx <= 0) {
        if (sanitized.debug) {
          console.debug('[captureViewportSamples] Non-positive scroll step; exiting loop');
        }
        break;
      }

      index += 1;
      window.scrollBy({ top: sanitized.scrollStepPx, behavior: 'auto' });

      if (sanitized.delayMs > 0) {
        await sleep(sanitized.delayMs);
      }
    }
  } finally {
    if (sanitized.restoreScrollPosition) {
      window.scrollTo({ top: originalScrollY, behavior: 'auto' });
    }
    if (sanitized.visualizeDuringCapture) {
      clearAdOverlays();
    }
  }

  const finishedAt = Date.now();

  return {
    samples,
    metadata: {
      startedAt,
      finishedAt,
      totalDurationMs: finishedAt - startedAt,
      initialScrollY: originalScrollY,
      finalScrollY: window.scrollY || window.pageYOffset,
      scrollStepPx: sanitized.scrollStepPx,
      delayMs: sanitized.delayMs,
      selectors: didSetCustomSelectors ? selectors : getEffectiveSelectors(undefined),
      maxScrolls: Number.isFinite(sanitized.maxScrolls) ? sanitized.maxScrolls : null,
      maxDurationMs: Number.isFinite(sanitized.maxDurationMs) ? sanitized.maxDurationMs : null
    }
  };
}
