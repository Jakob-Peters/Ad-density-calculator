/* AdScore DevTools bundle - 2025-10-01T10:32:13.220Z */
"use strict";
(() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __esm = (fn, res) => function __init() {
    return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
  };
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };

  // src/visualization/overlay.ts
  var overlay_exports = {};
  __export(overlay_exports, {
    clearAdOverlays: () => clearAdOverlays,
    renderAdOverlays: () => renderAdOverlays
  });
  function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }
  function hexToRgb(color) {
    const normalized = color.replace("#", "");
    if (normalized.length === 3) {
      const rHex = normalized.charAt(0);
      const gHex = normalized.charAt(1);
      const bHex = normalized.charAt(2);
      const r = parseInt(rHex + rHex, 16);
      const g = parseInt(gHex + gHex, 16);
      const b = parseInt(bHex + bHex, 16);
      if (Number.isNaN(r) || Number.isNaN(g) || Number.isNaN(b)) {
        return null;
      }
      return { r, g, b };
    }
    if (normalized.length === 6) {
      const r = parseInt(normalized.slice(0, 2), 16);
      const g = parseInt(normalized.slice(2, 4), 16);
      const b = parseInt(normalized.slice(4, 6), 16);
      if (Number.isNaN(r) || Number.isNaN(g) || Number.isNaN(b)) {
        return null;
      }
      return { r, g, b };
    }
    return null;
  }
  function applyAlpha(color, alpha) {
    const clampedAlpha = clamp(alpha, 0, 1);
    if (color.startsWith("rgba(")) {
      return color.replace(/rgba\(([^)]+)\)/, (_match, components) => {
        const parts = components.split(",").map((part) => part.trim());
        const base = parts.slice(0, 3).join(", ");
        return `rgba(${base}, ${clampedAlpha})`;
      });
    }
    if (color.startsWith("rgb(")) {
      return color.replace(/rgb\(([^)]+)\)/, (_match, components) => {
        return `rgba(${components.trim()}, ${clampedAlpha})`;
      });
    }
    if (color.startsWith("#")) {
      const rgb = hexToRgb(color);
      if (rgb) {
        const { r, g, b } = rgb;
        return `rgba(${r}, ${g}, ${b}, ${clampedAlpha})`;
      }
    }
    return color;
  }
  function uniqueSlotsByElement(slots) {
    const seen = /* @__PURE__ */ new Set();
    const uniques = [];
    slots.forEach((slot) => {
      if (seen.has(slot.element)) {
        return;
      }
      seen.add(slot.element);
      uniques.push(slot);
    });
    return uniques;
  }
  function disposeActiveState() {
    if (!activeState) {
      return;
    }
    window.removeEventListener("scroll", activeState.handleScroll, true);
    window.removeEventListener("resize", activeState.handleResize);
    if (activeState.rafId !== null) {
      cancelAnimationFrame(activeState.rafId);
    }
    activeState = null;
  }
  function clearAdOverlays() {
    if (typeof document === "undefined") {
      return;
    }
    disposeActiveState();
    const existing = document.getElementById(OVERLAY_ROOT_ID);
    if (existing?.parentNode) {
      existing.parentNode.removeChild(existing);
    }
  }
  function renderAdOverlays(slots, options = {}) {
    if (typeof document === "undefined") {
      return;
    }
    clearAdOverlays();
    const uniqueSlots = uniqueSlotsByElement(slots);
    if (uniqueSlots.length === 0) {
      return;
    }
    const palette = options.palette ?? DEFAULT_PALETTE;
    const opacity = options.opacity ?? DEFAULT_OVERLAY_OPACITY;
    const showLabels = options.showLabels ?? true;
    const root = document.createElement("div");
    root.id = OVERLAY_ROOT_ID;
    root.style.position = "absolute";
    root.style.top = "0";
    root.style.left = "0";
    root.style.width = "0";
    root.style.height = "0";
    root.style.pointerEvents = "none";
    root.style.zIndex = "2147483647";
    root.style.fontFamily = "system-ui, sans-serif";
    document.body.appendChild(root);
    const overlays = [];
    uniqueSlots.forEach((slot, index) => {
      const color = palette[index % palette.length] ?? "#ff00ff";
      const overlay = document.createElement("div");
      overlay.style.position = "absolute";
      overlay.style.backgroundColor = applyAlpha(color, opacity);
      overlay.style.border = `1px solid ${color}`;
      overlay.style.boxSizing = "border-box";
      overlay.style.pointerEvents = "none";
      if (showLabels) {
        const label = document.createElement("div");
        label.style.position = "absolute";
        label.style.top = "50%";
        label.style.left = "50%";
        label.style.transform = "translate(-50%, -50%)";
        label.style.padding = "6px 10px";
        label.style.background = "#111";
        label.style.color = "#fff";
        label.style.fontSize = "13px";
        label.style.lineHeight = "1.35";
        label.style.textAlign = "center";
        label.style.borderRadius = "6px";
        label.style.pointerEvents = "none";
        label.style.boxShadow = "0 4px 16px rgba(0, 0, 0, 0.45)";
        label.style.maxWidth = "260px";
        label.style.whiteSpace = "pre-line";
        label.style.opacity = "1";
        const coverage = (slot.coverageRatio * 100).toFixed(1);
        label.textContent = `${slot.slotName ?? slot.logicalId}
${slot.provider} \xB7 ${coverage}% viewport`;
        overlay.appendChild(label);
      }
      root.appendChild(overlay);
      overlays.push(overlay);
    });
    const state = {
      root,
      slots: uniqueSlots,
      overlays,
      rafId: null,
      handleScroll: () => {
      },
      handleResize: () => {
      }
    };
    state.handleScroll = () => scheduleUpdate(state);
    state.handleResize = () => scheduleUpdate(state);
    activeState = state;
    window.addEventListener("scroll", state.handleScroll, true);
    window.addEventListener("resize", state.handleResize);
    updateOverlayPositions(state);
  }
  function updateOverlayPositions(state) {
    state.overlays.forEach((overlay, index) => {
      const slot = state.slots[index];
      if (!slot) {
        overlay.style.display = "none";
        return;
      }
      const element = slot.element;
      if (!element || typeof element.getBoundingClientRect !== "function") {
        overlay.style.display = "none";
        return;
      }
      const rect = element.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) {
        overlay.style.display = "none";
        return;
      }
      overlay.style.display = "block";
      overlay.style.left = "0";
      overlay.style.top = "0";
      overlay.style.transform = `translate(${rect.left + window.scrollX}px, ${rect.top + window.scrollY}px)`;
      overlay.style.width = `${rect.width}px`;
      overlay.style.height = `${rect.height}px`;
      overlay.style.transformOrigin = "top left";
    });
  }
  function scheduleUpdate(state) {
    if (state.rafId !== null) {
      return;
    }
    state.rafId = requestAnimationFrame(() => {
      state.rafId = null;
      updateOverlayPositions(state);
    });
  }
  var OVERLAY_ROOT_ID, DEFAULT_PALETTE, DEFAULT_OVERLAY_OPACITY, activeState;
  var init_overlay = __esm({
    "src/visualization/overlay.ts"() {
      "use strict";
      OVERLAY_ROOT_ID = "__ad_score_overlay_root__";
      DEFAULT_PALETTE = ["#1f77b4", "#ff7f0e", "#2ca02c", "#d62728"];
      DEFAULT_OVERLAY_OPACITY = 0.4;
      activeState = null;
    }
  });

  // src/reporting/summary.ts
  function buildReportSummary(report) {
    const densityMetric = report.metrics.find((metric) => metric.configId === "adDensity");
    const summary = {
      url: typeof window !== "undefined" ? window.location.href : "unknown",
      timestamp: report.timestamp,
      profileId: report.profile.id,
      totalScore: report.totalScore,
      sampleCount: report.measurement.samples.length,
      uniqueAdSlots: countUniqueSlots(report)
    };
    if (densityMetric) {
      const meta = densityMetric.result.meta;
      const density = {
        raw: densityMetric.result.rawValue,
        score: densityMetric.result.score
      };
      if (typeof meta?.stickyContributionArea === "number") {
        density.stickyContributionArea = meta.stickyContributionArea;
      }
      if (typeof meta?.stickySlotCount === "number") {
        density.stickySlotCount = meta.stickySlotCount;
      }
      if (typeof meta?.totalContentArea === "number") {
        density.totalContentArea = meta.totalContentArea;
      }
      summary.density = density;
    }
    return summary;
  }
  function countUniqueSlots(report) {
    const uniqueIds = /* @__PURE__ */ new Set();
    for (const sample of report.measurement.samples) {
      for (const slot of sample.adSlots) {
        uniqueIds.add(`${slot.provider}::${slot.logicalId}`);
      }
    }
    return uniqueIds.size;
  }
  var init_summary = __esm({
    "src/reporting/summary.ts"() {
      "use strict";
    }
  });

  // src/reporting/consoleReporter.ts
  var consoleReporter_exports = {};
  __export(consoleReporter_exports, {
    renderConsoleReport: () => renderConsoleReport
  });
  function formatPercent(value, decimals = 1) {
    return `${(value * 100).toFixed(decimals)}%`;
  }
  function formatScore(value, decimals = 1) {
    return value.toFixed(decimals);
  }
  function renderConsoleReport(report) {
    const total = report.totalScore.toFixed(1);
    const header = `AdScore: ${total} / 100 (metrics: ${report.metrics.length})`;
    console.groupCollapsed(header);
    console.log("Profile:", report.profile.label, `(${report.profile.id})`);
    console.log("Measured samples:", report.measurement.samples.length);
    console.log("Selectors used:", report.config.selectors.join(", "));
    const summary = buildReportSummary(report);
    console.log("Summary:", {
      url: summary.url,
      score: `${summary.totalScore.toFixed(1)}`,
      samples: summary.sampleCount,
      uniqueSlots: summary.uniqueAdSlots,
      densityRaw: summary.density ? formatPercent(summary.density.raw) : "n/a",
      stickySlots: summary.density?.stickySlotCount ?? 0
    });
    const tableData = report.metrics.map((metric) => ({
      metric: metric.configId,
      score: formatScore(metric.result.score),
      weight: metric.weight.toFixed(2),
      weightedScore: formatScore(metric.weightedScore),
      raw: formatPercent(metric.result.rawValue)
    }));
    if (tableData.length > 0) {
      console.table(tableData);
    } else {
      console.log("No active metrics computed. Check configuration.");
    }
    console.log("Totals:", {
      totalWeightedScore: report.totalWeightedScore.toFixed(2),
      totalWeightedMaxScore: report.totalWeightedMaxScore.toFixed(2),
      totalScore: `${total}`
    });
    console.log("Export JSON:", JSON.stringify(summary));
    console.groupEnd();
  }
  var init_consoleReporter = __esm({
    "src/reporting/consoleReporter.ts"() {
      "use strict";
      init_summary();
    }
  });

  // src/measurement/selectors.ts
  var DEFAULT_AD_SELECTORS = [
    'div[id*="div-gpt-ad-"]',
    "[data-google-query-id]",
    '[class*="adnm-"]'
  ];
  var DATASET_ID_CANDIDATES = [
    "googleAdId",
    "googleQueryId",
    "adId",
    "adid",
    "adUnit",
    "adunit",
    "adSlot",
    "slotId",
    "pbAdId",
    "pbSlot",
    "pbid",
    "placementId",
    "adnmFid"
  ];
  var ATTRIBUTE_ID_CANDIDATES = [
    "id",
    "data-google-query-id",
    "data-adslot",
    "data-adunit",
    "data-slot",
    "data-adid",
    "data-ad-name",
    "data-adnm-fid",
    "data-pb-slot",
    "data-bidder",
    "data-prebid"
  ];

  // src/measurement/elementId.ts
  var DATA_ATTRIBUTE_KEY = "adsCoreId";
  function randomId() {
    if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
      return crypto.randomUUID();
    }
    return "ad_" + Math.random().toString(36).slice(2, 11);
  }
  function ensureElementId(element) {
    const existing = element.dataset[DATA_ATTRIBUTE_KEY];
    if (existing) {
      return existing;
    }
    const id = randomId();
    element.dataset[DATA_ATTRIBUTE_KEY] = id;
    return id;
  }

  // src/measurement/adCollector.ts
  var VIEWPORT = () => ({
    width: window.innerWidth,
    height: window.innerHeight
  });
  function toNormalizedRect(rect) {
    return {
      top: rect.top,
      left: rect.left,
      width: rect.width,
      height: rect.height
    };
  }
  function computeVisibleRect(rect, viewportWidth, viewportHeight) {
    const visibleTop = Math.max(rect.top, 0);
    const visibleLeft = Math.max(rect.left, 0);
    const visibleRight = Math.min(rect.right, viewportWidth);
    const visibleBottom = Math.min(rect.bottom, viewportHeight);
    const width = Math.max(0, visibleRight - visibleLeft);
    const height = Math.max(0, visibleBottom - visibleTop);
    return {
      top: width > 0 && height > 0 ? visibleTop : 0,
      left: width > 0 && height > 0 ? visibleLeft : 0,
      width,
      height
    };
  }
  function hasHighImpactDataset(element) {
    const dataset = element.dataset;
    return !!dataset.adnmFid || !!dataset.adnmSid || !!dataset.adnmCc || !!dataset.adnmChannel || !!dataset.gumgum || !!dataset.highimpact || !!dataset.hiad;
  }
  var HIGH_IMPACT_CLASS_TOKENS = ["adnm-", "adsm-", "gumgum", "highimpact", "hiad"];
  function hasHighImpactClass(element) {
    return Array.from(element.classList.values()).some(
      (cls) => HIGH_IMPACT_CLASS_TOKENS.some((token) => cls.toLowerCase().includes(token))
    );
  }
  function inferProvider(element) {
    const id = element.id || "";
    const classList = Array.from(element.classList.values()).join(" ");
    const dataset = element.dataset;
    const src = element.src ?? "";
    if (id.startsWith("div-gpt-ad") || id.includes("google_ads_iframe") || dataset.googleQueryId || src.includes("/gampad/")) {
      return "gpt";
    }
    if ("adnmFid" in dataset || dataset.adnmFid || hasHighImpactDataset(element) || hasHighImpactClass(element)) {
      return "adnami";
    }
    if (dataset.prebid !== void 0 || dataset.pbSlot !== void 0 || dataset.pbadid !== void 0 || dataset.ortb2 !== void 0 || id.startsWith("pb-slot-") || classList.includes("prebid")) {
      return "prebid";
    }
    return "generic";
  }
  function pickSlotName(element) {
    const dataset = element.dataset;
    for (const key of DATASET_ID_CANDIDATES) {
      const value = dataset[key];
      if (value) {
        return value;
      }
    }
    for (const attr of ATTRIBUTE_ID_CANDIDATES) {
      const value = element.getAttribute(attr);
      if (value) {
        return value;
      }
    }
    if (element.id) {
      return element.id;
    }
    return null;
  }
  function isElementVisible(element, rect) {
    const style = window.getComputedStyle(element);
    if (style.display === "none" || style.visibility === "hidden" || Number.parseFloat(style.opacity) === 0) {
      return false;
    }
    return rect.bottom > 0 && rect.top < window.innerHeight && rect.right > 0 && rect.left < window.innerWidth;
  }
  function detectSticky(element, includeSticky) {
    if (!includeSticky) {
      return false;
    }
    const style = window.getComputedStyle(element);
    if (style.position === "fixed" || style.position === "sticky") {
      return true;
    }
    const parent = element.closest('[style*="position:fixed"], [style*="position: sticky"]');
    if (parent) {
      return true;
    }
    const dataset = element.dataset;
    const manualPlacement = dataset.manualPlacementGroup ?? dataset.adPositionName ?? "";
    if (manualPlacement.toLowerCase().includes("sticky")) {
      return true;
    }
    const fid = dataset.adnmFid ?? "";
    if (fid) {
      const lower = fid.toLowerCase();
      if (lower.includes("skin") || lower.includes("topscroll") || lower.includes("canvas")) {
        return true;
      }
    }
    if (hasHighImpactDataset(element) || hasHighImpactClass(element)) {
      return true;
    }
    return false;
  }
  function uniqueElements(elements) {
    const seen = /* @__PURE__ */ new Set();
    const result = [];
    for (const el of elements) {
      if (seen.has(el)) {
        continue;
      }
      seen.add(el);
      result.push(el);
    }
    return result;
  }
  var IFRAMES_PREFERRING_SELECTORS = [
    'iframe[id^="google_ads_iframe"]',
    "iframe[data-adnm-channel]",
    'iframe[src*="adnami"]',
    'iframe[src*="gumgum"]',
    'iframe[src*="highimpact"]',
    'iframe[src*="adform"]'
  ].join(", ");
  function pickDominantDescendant(element, elementArea) {
    const candidates = Array.from(element.querySelectorAll(IFRAMES_PREFERRING_SELECTORS));
    let best = null;
    let bestArea = 0;
    for (const candidate of candidates) {
      const rect = candidate.getBoundingClientRect();
      const area = rect.width * rect.height;
      if (area > bestArea) {
        best = candidate;
        bestArea = area;
      }
    }
    if (!best) {
      return null;
    }
    if (elementArea <= 0) {
      return best;
    }
    const areaRatio = bestArea / elementArea;
    if (areaRatio >= 0.8 || elementArea < 500) {
      return best;
    }
    return null;
  }
  function resolveMeasurableElement(candidate) {
    if (!candidate.isConnected) {
      return null;
    }
    if (candidate.tagName === "IFRAME") {
      return candidate;
    }
    if (hasHighImpactDataset(candidate) || hasHighImpactClass(candidate)) {
      return candidate;
    }
    const rect = candidate.getBoundingClientRect();
    const area = rect.width * rect.height;
    const dominantDescendant = pickDominantDescendant(candidate, area);
    if (dominantDescendant) {
      return dominantDescendant;
    }
    return candidate;
  }
  function deriveLogicalId(element, slotName) {
    const dataset = element.dataset;
    const candidates = [
      dataset.googleAdId,
      dataset.googleQueryId,
      dataset.adUnit,
      dataset.adunit,
      dataset.adSlot,
      dataset.adslot,
      dataset.slotId,
      dataset.googleContainerId,
      dataset.pbAdId,
      dataset.adnmSid,
      dataset.adnmFid,
      dataset.adnmChannel,
      dataset.adsCoreId,
      slotName,
      element.id
    ];
    const logical = candidates.find((value) => typeof value === "string" && value.trim().length > 0);
    return logical ?? ensureElementId(element);
  }
  function filterHighImpactWrappers(samples, viewportArea) {
    const groups = /* @__PURE__ */ new Map();
    for (const sample of samples) {
      if (sample.provider !== "adnami") {
        continue;
      }
      const dataset = sample.dataset;
      const groupKey = dataset.adnmSid ?? dataset.adnmFid ?? dataset.adnmChannel;
      if (!groupKey) {
        continue;
      }
      const group = groups.get(groupKey) ?? [];
      group.push(sample);
      groups.set(groupKey, group);
    }
    const toOmit = /* @__PURE__ */ new Set();
    for (const group of groups.values()) {
      if (group.length <= 1) {
        continue;
      }
      const threshold = viewportArea * 0.9;
      const largeSurfaces = group.filter((sample) => sample.visibleArea >= threshold);
      const smallerSurfaces = group.filter((sample) => sample.visibleArea > 0 && sample.visibleArea < threshold);
      if (largeSurfaces.length > 0 && smallerSurfaces.length > 0) {
        for (const sample of largeSurfaces) {
          toOmit.add(sample);
        }
        continue;
      }
      if (largeSurfaces.length > 1) {
        const sorted = [...largeSurfaces].sort((a, b) => b.visibleArea - a.visibleArea);
        for (const sample of sorted.slice(1)) {
          toOmit.add(sample);
        }
      }
    }
    if (toOmit.size === 0) {
      return samples;
    }
    return samples.filter((sample) => !toOmit.has(sample));
  }
  function collectAdSlotSamples(options = {}) {
    const { selectors = DEFAULT_AD_SELECTORS, includeStickyDetection = true } = options;
    const viewport = VIEWPORT();
    const rawElements = selectors.flatMap((selector) => Array.from(document.querySelectorAll(selector))).filter(Boolean);
    const normalizedElements = rawElements.map(resolveMeasurableElement).filter(Boolean);
    const uniqueCandidates = uniqueElements(normalizedElements);
    const samples = [];
    const preliminarySamples = [];
    for (const element of uniqueCandidates) {
      const rect = element.getBoundingClientRect();
      const visibleRect = computeVisibleRect(rect, viewport.width, viewport.height);
      const visibleArea = visibleRect.width * visibleRect.height;
      const surfaceArea = rect.width * rect.height;
      const isVisible = isElementVisible(element, rect) && visibleArea > 0;
      const slotId = ensureElementId(element);
      const slotName = pickSlotName(element);
      const datasetRecord = {};
      for (const [key, value] of Object.entries(element.dataset)) {
        if (typeof value === "string") {
          datasetRecord[key] = value;
        }
      }
      const logicalId = deriveLogicalId(element, slotName);
      const provider = inferProvider(element);
      if (provider === "adnami" && !datasetRecord.adnmFid && !datasetRecord.adnmSid && !datasetRecord.adnmChannel) {
        continue;
      }
      preliminarySamples.push({
        element,
        id: slotId,
        logicalId,
        provider,
        slotName,
        dataset: datasetRecord,
        boundingRect: toNormalizedRect(rect),
        visibleRect,
        surfaceArea,
        visibleArea,
        coverageRatio: viewport.width * viewport.height > 0 ? visibleArea / (viewport.width * viewport.height) : 0,
        isVisible,
        isSticky: detectSticky(element, includeStickyDetection)
      });
    }
    const filteredSamples = filterHighImpactWrappers(preliminarySamples, viewport.width * viewport.height);
    const visibleSamples = filteredSamples.filter((sample) => sample.isVisible && sample.visibleArea > 0);
    const deduped = /* @__PURE__ */ new Map();
    for (const sample of visibleSamples) {
      const key = `${sample.provider}::${sample.logicalId}`;
      const existing = deduped.get(key);
      if (!existing || sample.visibleArea > existing.visibleArea) {
        deduped.set(key, sample);
      }
    }
    return Array.from(deduped.values());
  }
  function getEffectiveSelectors(options) {
    if (options?.selectors && options.selectors.length > 0) {
      return options.selectors;
    }
    return DEFAULT_AD_SELECTORS;
  }

  // src/measurement/scrollHarness.ts
  init_overlay();
  var DEFAULT_DELAY_MS = 1500;
  var MIN_DELAY_MS = 100;
  var DEFAULT_SCROLL_STEP = () => window.innerHeight;
  function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, Math.max(ms, 0)));
  }
  function getDocumentHeight() {
    return Math.max(
      document.body?.scrollHeight ?? 0,
      document.documentElement?.scrollHeight ?? 0,
      document.body?.offsetHeight ?? 0,
      document.documentElement?.offsetHeight ?? 0,
      document.body?.clientHeight ?? 0,
      document.documentElement?.clientHeight ?? 0
    );
  }
  function isAtBottom() {
    const scrollTop = window.scrollY || window.pageYOffset;
    return scrollTop + window.innerHeight >= getDocumentHeight() - 2;
  }
  function sanitizeOptions(options = {}) {
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
  function buildViewportSample(index, selectors, includeStickyDetection) {
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
  async function captureViewportSamples(options = {}) {
    const sanitized = sanitizeOptions(options);
    const selectors = getEffectiveSelectors(options);
    const originalScrollY = window.scrollY || window.pageYOffset;
    const startedAt = Date.now();
    const samples = [];
    let didSetCustomSelectors = false;
    if (options?.selectors && options.selectors.length > 0) {
      didSetCustomSelectors = true;
    }
    try {
      let index = 0;
      const startHighRes = typeof performance !== "undefined" ? performance.now() : Date.now();
      const aggregateSlots = /* @__PURE__ */ new Map();
      const makeSlotKey = (slot) => `${slot.provider}::${slot.logicalId}`;
      while (index < sanitized.maxScrolls) {
        if (sanitized.debug) {
          console.debug("[captureViewportSamples] Sampling viewport", { index, scrollY: window.scrollY });
        }
        const sample = buildViewportSample(index, selectors, sanitized.includeStickyDetection);
        samples.push(sample);
        if (sanitized.visualizeDuringCapture) {
          for (const slot of sample.adSlots) {
            aggregateSlots.set(makeSlotKey(slot), slot);
          }
          renderAdOverlays(Array.from(aggregateSlots.values()));
        }
        const elapsed = (typeof performance !== "undefined" ? performance.now() : Date.now()) - startHighRes;
        if (elapsed > sanitized.maxDurationMs) {
          if (sanitized.debug) {
            console.debug("[captureViewportSamples] Stopping due to maxDurationMs threshold");
          }
          break;
        }
        if (isAtBottom()) {
          if (sanitized.debug) {
            console.debug("[captureViewportSamples] Reached bottom of page");
          }
          break;
        }
        if (sanitized.scrollStepPx <= 0) {
          if (sanitized.debug) {
            console.debug("[captureViewportSamples] Non-positive scroll step; exiting loop");
          }
          break;
        }
        index += 1;
        window.scrollBy({ top: sanitized.scrollStepPx, behavior: "auto" });
        if (sanitized.delayMs > 0) {
          await sleep(sanitized.delayMs);
        }
      }
    } finally {
      if (sanitized.restoreScrollPosition) {
        window.scrollTo({ top: originalScrollY, behavior: "auto" });
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
        selectors: didSetCustomSelectors ? selectors : getEffectiveSelectors(void 0),
        maxScrolls: Number.isFinite(sanitized.maxScrolls) ? sanitized.maxScrolls : null,
        maxDurationMs: Number.isFinite(sanitized.maxDurationMs) ? sanitized.maxDurationMs : null
      }
    };
  }

  // src/config/defaultConfig.ts
  var VERSION = "0.1.0";
  var BASE_METRICS = {
    adDensity: {
      id: "adDensity",
      enabled: true,
      weight: 1,
      maxScore: 100,
      thresholds: {
        ideal: 0.25,
        caution: 0.55,
        fail: 0.85
      }
    },
    adCount: {
      id: "adCount",
      enabled: false,
      weight: 0,
      maxScore: 0,
      thresholds: {
        ideal: 5,
        caution: 8,
        fail: 12
      }
    },
    contentDistance: {
      id: "contentDistance",
      enabled: false,
      weight: 0,
      maxScore: 0,
      thresholds: {
        ideal: 600,
        caution: 360,
        fail: 180
      }
    },
    viewportCoverage: {
      id: "viewportCoverage",
      enabled: false,
      weight: 0,
      maxScore: 0,
      thresholds: {
        ideal: 0.3,
        caution: 0.45,
        fail: 0.7
      }
    }
  };
  var BASE_PROFILES = {
    desktop: {
      id: "desktop",
      label: "Desktop default",
      scroll: {
        delayMs: 1500,
        maxScrolls: 16,
        maxDurationMs: 12e4
      },
      metricWeights: {
        adDensity: 1
      }
    },
    mobile: {
      id: "mobile",
      label: "Mobile default",
      scroll: {
        delayMs: 1e3,
        maxScrolls: 20,
        maxDurationMs: 14e4
      },
      metricWeights: {
        adDensity: 1
      }
    }
  };
  function cloneMetric(metric) {
    return {
      ...metric,
      thresholds: { ...metric.thresholds }
    };
  }
  function deepMergeMetric(base, override) {
    const merged = { ...base, ...override };
    if (override.thresholds) {
      merged.thresholds = {
        ...base.thresholds,
        ...override.thresholds
      };
    }
    return merged;
  }
  function deepMergeProfile(base, override) {
    return {
      ...base,
      ...override,
      scroll: {
        ...base.scroll,
        ...override.scroll
      },
      metricWeights: {
        ...base.metricWeights,
        ...override.metricWeights
      }
    };
  }
  function createConfig(options = {}) {
    const { overrides, profileId } = options;
    const metrics = {
      adDensity: cloneMetric(BASE_METRICS.adDensity),
      adCount: cloneMetric(BASE_METRICS.adCount),
      contentDistance: cloneMetric(BASE_METRICS.contentDistance),
      viewportCoverage: cloneMetric(BASE_METRICS.viewportCoverage)
    };
    if (overrides?.metrics) {
      for (const key of Object.keys(overrides.metrics)) {
        const overrideConfig = overrides.metrics[key];
        if (!overrideConfig) continue;
        metrics[key] = deepMergeMetric(metrics[key], overrideConfig);
      }
    }
    const profiles = {
      desktop: { ...BASE_PROFILES.desktop, scroll: { ...BASE_PROFILES.desktop.scroll }, metricWeights: { ...BASE_PROFILES.desktop.metricWeights } },
      mobile: { ...BASE_PROFILES.mobile, scroll: { ...BASE_PROFILES.mobile.scroll }, metricWeights: { ...BASE_PROFILES.mobile.metricWeights } }
    };
    if (overrides?.profiles) {
      for (const key of Object.keys(overrides.profiles)) {
        const overrideProfile = overrides.profiles[key];
        if (!overrideProfile) continue;
        profiles[key] = deepMergeProfile(profiles[key], overrideProfile);
      }
    }
    const selectors = overrides?.selectors?.length ? overrides.selectors : [...DEFAULT_AD_SELECTORS];
    const defaultProfile = overrides?.defaultProfile ?? "desktop";
    const selectedProfileId = profileId ?? defaultProfile;
    const profile = profiles[selectedProfileId];
    const config = {
      version: VERSION,
      selectors,
      metrics,
      profiles,
      defaultProfile
    };
    return {
      config,
      profile
    };
  }

  // src/metrics/adDensity.ts
  function clampScore(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }
  function calculateLinearScore(raw, ideal, fail, maxScore) {
    if (fail === ideal) {
      return raw <= ideal ? maxScore : 0;
    }
    if (raw <= ideal) {
      return maxScore;
    }
    if (raw >= fail) {
      return 0;
    }
    const ratio = (raw - ideal) / (fail - ideal);
    return clampScore(maxScore * (1 - ratio), 0, maxScore);
  }
  function deriveSlotKey(slot) {
    const dataset = slot.dataset;
    const candidates = [
      dataset.googleQueryId,
      dataset.googleAdId,
      dataset.adSlot,
      dataset.adUnit,
      dataset.googleContainerId,
      dataset.adnmSid,
      dataset.adnmFid,
      dataset.adnmChannel,
      dataset.adsCoreId,
      slot.slotName,
      slot.logicalId,
      slot.id
    ];
    const key = candidates.find((value) => typeof value === "string" && value.trim().length > 0);
    return key ?? slot.id;
  }
  function isStickySlot(slot) {
    if (slot.isSticky) {
      return true;
    }
    const dataset = slot.dataset;
    const manualPlacement = dataset.manualPlacementGroup ?? dataset.adPositionName ?? "";
    if (manualPlacement.toLowerCase().includes("sticky")) {
      return true;
    }
    const fid = dataset.adnmFid ?? "";
    if (fid) {
      const lower = fid.toLowerCase();
      if (lower.includes("skin") || lower.includes("topscroll") || lower.includes("canvas")) {
        return true;
      }
    }
    const slotName = slot.slotName ?? "";
    if (slotName.toLowerCase().includes("sticky")) {
      return true;
    }
    return false;
  }
  function computeAdDensity(context) {
    const { config, run } = context;
    const { thresholds } = config;
    let dynamicVisibleAdArea = 0;
    let totalContentArea = 0;
    let unclampedVisibleAdArea = 0;
    let clampedSamples = 0;
    const stickyMaxArea = /* @__PURE__ */ new Map();
    for (const sample of run.samples) {
      let sampleVisibleArea = 0;
      let sampleNonStickyArea = 0;
      for (const slot of sample.adSlots) {
        if (!slot.isVisible || slot.visibleArea <= 0) {
          continue;
        }
        const effectiveArea = Math.min(slot.visibleArea, sample.totalContentArea);
        sampleVisibleArea += effectiveArea;
        if (isStickySlot(slot)) {
          const key = deriveSlotKey(slot);
          const current = stickyMaxArea.get(key) ?? 0;
          if (effectiveArea > current) {
            stickyMaxArea.set(key, effectiveArea);
          }
          continue;
        }
        sampleNonStickyArea += effectiveArea;
      }
      unclampedVisibleAdArea += sampleVisibleArea;
      const clampedNonStickyArea = Math.min(sampleNonStickyArea, sample.totalContentArea);
      if (clampedNonStickyArea < sampleNonStickyArea) {
        clampedSamples += 1;
      }
      dynamicVisibleAdArea += clampedNonStickyArea;
      totalContentArea += sample.totalContentArea;
    }
    const stickyTotalArea = Array.from(stickyMaxArea.values()).reduce((sum, area) => sum + area, 0);
    const totalVisibleAdArea = dynamicVisibleAdArea + stickyTotalArea;
    const density = totalContentArea > 0 ? totalVisibleAdArea / totalContentArea : 0;
    const rawValue = Number.isFinite(density) ? density : 0;
    const score = calculateLinearScore(rawValue, thresholds.ideal, thresholds.fail, config.maxScore);
    const normalizedScore = config.maxScore > 0 ? score / config.maxScore : 0;
    return {
      id: config.id,
      rawValue,
      score,
      maxScore: config.maxScore,
      normalizedScore,
      meta: {
        sampleCount: run.samples.length,
        totalVisibleAdArea,
        unclampedVisibleAdArea,
        stickyContributionArea: stickyTotalArea,
        stickySlotCount: stickyMaxArea.size,
        clampedSamples,
        totalContentArea,
        thresholds
      }
    };
  }

  // src/runtime/runAudit.ts
  var METRIC_COMPUTERS = {
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
      if (typeof overrides.delayMs === "number") merged.delayMs = overrides.delayMs;
      if (typeof overrides.scrollStepPx === "number") merged.scrollStepPx = overrides.scrollStepPx;
      if (typeof overrides.maxScrolls === "number") merged.maxScrolls = overrides.maxScrolls;
      if (typeof overrides.maxDurationMs === "number") merged.maxDurationMs = overrides.maxDurationMs;
      if (typeof overrides.includeStickyDetection === "boolean") {
        merged.includeStickyDetection = overrides.includeStickyDetection;
      }
      if (typeof overrides.restoreScrollPosition === "boolean") {
        merged.restoreScrollPosition = overrides.restoreScrollPosition;
      }
      if (typeof overrides.respectShadowDom === "boolean") {
        merged.respectShadowDom = overrides.respectShadowDom;
      }
    }
    const debugValue = typeof debugFlag === "boolean" ? debugFlag : overrides?.debug;
    if (typeof debugValue === "boolean") {
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
    const totalScore = totalWeightedMaxScore > 0 ? totalWeightedScore / totalWeightedMaxScore * 100 : 0;
    return {
      totalWeightedScore,
      totalWeightedMaxScore,
      totalScore
    };
  }
  async function runAdScoreAudit(options = {}) {
    const {
      profileId,
      configOverrides,
      measurement: measurementOverrides,
      debug,
      consoleReport,
      visualize
    } = options;
    const createConfigOptions = {};
    if (configOverrides) {
      createConfigOptions.overrides = configOverrides;
    }
    if (profileId) {
      createConfigOptions.profileId = profileId;
    }
    const { config, profile } = createConfig(createConfigOptions);
    if (debug) {
      console.debug("[AdScore] Using profile", profile);
      console.debug("[AdScore] Config selectors", config.selectors);
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
    if (typeof visualize === "boolean") {
      try {
        const overlayModule = await Promise.resolve().then(() => (init_overlay(), overlay_exports));
        if (visualize) {
          const firstSample = report.measurement.samples[0];
          if (firstSample) {
            overlayModule.renderAdOverlays(firstSample.adSlots);
          }
        } else {
          overlayModule.clearAdOverlays();
        }
      } catch (error) {
        console.warn("[AdScore] Failed to toggle overlay", error);
      }
    }
    if (consoleReport) {
      try {
        const { renderConsoleReport: renderConsoleReport2 } = await Promise.resolve().then(() => (init_consoleReporter(), consoleReporter_exports));
        renderConsoleReport2(report);
      } catch (error) {
        console.warn("[AdScore] Failed to render console report", error);
      }
    }
    return report;
  }

  // src/devtools-entry.ts
  init_summary();
  var GLOBAL_KEY = "__AD_SCORE_RUNTIME__";
  var storedConfigOverrides;
  var storedMeasurementOverrides;
  var lastReport = null;
  var defaultVisualize = false;
  var slotCacheKey = (slot) => `${slot.provider}::${slot.logicalId}`;
  function collectUniqueSlots(samples) {
    const map = /* @__PURE__ */ new Map();
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
    const measurementWithVisualization = visualizeFlag ? { ...baseMeasurement ?? {}, visualizeDuringCapture: true } : baseMeasurement;
    const mergedOptions = {
      ...options,
      configOverrides: options.configOverrides ?? storedConfigOverrides,
      measurement: measurementWithVisualization,
      visualize: visualizeFlag
    };
    const report = await runAdScoreAudit(mergedOptions);
    lastReport = report;
    const overlayModule = await Promise.resolve().then(() => (init_overlay(), overlay_exports));
    if (visualizeFlag) {
      overlayModule.renderAdOverlays(collectUniqueSlots(report.measurement.samples));
    } else {
      overlayModule.clearAdOverlays();
    }
    return report;
  }
  async function renderOverlayFromLastReport(sampleIndex = 0) {
    if (!lastReport) {
      console.warn("[AdScore] No report available. Run runAudit() first.");
      return;
    }
    const overlayModule = await Promise.resolve().then(() => (init_overlay(), overlay_exports));
    if (typeof sampleIndex === "number" && sampleIndex >= 0) {
      const sample = lastReport.measurement.samples[sampleIndex];
      if (!sample) {
        console.warn("[AdScore] Sample index out of range.");
        return;
      }
      overlayModule.renderAdOverlays(sample.adSlots);
    } else {
      overlayModule.renderAdOverlays(collectUniqueSlots(lastReport.measurement.samples));
    }
  }
  async function clearOverlay() {
    const overlayModule = await Promise.resolve().then(() => (init_overlay(), overlay_exports));
    overlayModule.clearAdOverlays();
  }
  function exposeToWindow(api2) {
    if (typeof window === "undefined") {
      return;
    }
    if (!(GLOBAL_KEY in window)) {
      Object.defineProperty(window, GLOBAL_KEY, {
        value: api2,
        configurable: false,
        enumerable: false,
        writable: false
      });
    }
    window.runAdScoreMeasurement = api2.runMeasurement;
    window.runAdScoreAudit = api2.runAudit;
    window.adScore = api2;
    if (typeof console !== "undefined") {
      console.info("[AdScore] DevTools API exposed:", {
        measurement: "window.runAdScoreMeasurement(options)",
        audit: "window.runAdScoreAudit(options)",
        runtime: "window.adScore"
      });
    }
  }
  var api = {
    runMeasurement,
    runAudit: runAuditWithState,
    setConfigOverrides: (overrides) => {
      storedConfigOverrides = overrides;
      console.info("[AdScore] Config overrides updated", overrides);
    },
    getConfigOverrides: () => storedConfigOverrides,
    setMeasurementDefaults: (overrides) => {
      storedMeasurementOverrides = overrides;
      console.info("[AdScore] Measurement defaults updated", overrides);
    },
    getMeasurementDefaults: () => storedMeasurementOverrides,
    getLastReport: () => lastReport,
    getLastSummary: () => lastReport ? buildReportSummary(lastReport) : null,
    renderOverlay: renderOverlayFromLastReport,
    clearOverlay,
    setDefaultVisualize: (value) => {
      defaultVisualize = value;
      console.info("[AdScore] Default visualize set to", value);
    },
    version: "0.1.0"
  };
  exposeToWindow(api);
})();
//# sourceMappingURL=adscore-devtools.js.map
