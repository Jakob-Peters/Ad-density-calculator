import { ATTRIBUTE_ID_CANDIDATES, DATASET_ID_CANDIDATES, DEFAULT_AD_SELECTORS } from './selectors.js';
import { ensureElementId } from './elementId.js';
const VIEWPORT = () => ({
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
    return (!!dataset.adnmFid ||
        !!dataset.adnmSid ||
        !!dataset.adnmCc ||
        !!dataset.adnmChannel ||
        !!dataset.gumgum ||
        !!dataset.highimpact ||
        !!dataset.hiad);
}
const HIGH_IMPACT_CLASS_TOKENS = ['adnm-', 'adsm-', 'gumgum', 'highimpact', 'hiad'];
function hasHighImpactClass(element) {
    return Array.from(element.classList.values()).some(cls => HIGH_IMPACT_CLASS_TOKENS.some(token => cls.toLowerCase().includes(token)));
}
function inferProvider(element) {
    const id = element.id || '';
    const classList = Array.from(element.classList.values()).join(' ');
    const dataset = element.dataset;
    const src = element.src ?? '';
    if (id.startsWith('div-gpt-ad') || id.includes('google_ads_iframe') || dataset.googleQueryId || src.includes('/gampad/')) {
        return 'gpt';
    }
    if ('adnmFid' in dataset || dataset.adnmFid || hasHighImpactDataset(element) || hasHighImpactClass(element)) {
        return 'adnami';
    }
    if (dataset.prebid !== undefined ||
        dataset.pbSlot !== undefined ||
        dataset.pbadid !== undefined ||
        dataset.ortb2 !== undefined ||
        id.startsWith('pb-slot-') ||
        classList.includes('prebid')) {
        return 'prebid';
    }
    return 'generic';
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
    if (style.display === 'none' || style.visibility === 'hidden' || Number.parseFloat(style.opacity) === 0) {
        return false;
    }
    return rect.bottom > 0 && rect.top < window.innerHeight && rect.right > 0 && rect.left < window.innerWidth;
}
function detectSticky(element, includeSticky) {
    if (!includeSticky) {
        return false;
    }
    const style = window.getComputedStyle(element);
    if (style.position === 'fixed' || style.position === 'sticky') {
        return true;
    }
    const parent = element.closest('[style*="position:fixed"], [style*="position: sticky"]');
    if (parent) {
        return true;
    }
    const dataset = element.dataset;
    const manualPlacement = dataset.manualPlacementGroup ?? dataset.adPositionName ?? '';
    if (manualPlacement.toLowerCase().includes('sticky')) {
        return true;
    }
    const fid = dataset.adnmFid ?? '';
    if (fid) {
        const lower = fid.toLowerCase();
        if (lower.includes('skin') || lower.includes('topscroll') || lower.includes('canvas')) {
            return true;
        }
    }
    if (hasHighImpactDataset(element) || hasHighImpactClass(element)) {
        return true;
    }
    return false;
}
function uniqueElements(elements) {
    const seen = new Set();
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
const IFRAMES_PREFERRING_SELECTORS = [
    'iframe[id^="google_ads_iframe"]',
    'iframe[data-adnm-channel]',
    'iframe[src*="adnami"]',
    'iframe[src*="gumgum"]',
    'iframe[src*="highimpact"]',
    'iframe[src*="adform"]'
].join(', ');
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
    if (candidate.tagName === 'IFRAME') {
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
    const logical = candidates.find(value => typeof value === 'string' && value.trim().length > 0);
    return logical ?? ensureElementId(element);
}
function filterHighImpactWrappers(samples, viewportArea) {
    const groups = new Map();
    for (const sample of samples) {
        if (sample.provider !== 'adnami') {
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
    const toOmit = new Set();
    for (const group of groups.values()) {
        if (group.length <= 1) {
            continue;
        }
        const threshold = viewportArea * 0.9;
        const largeSurfaces = group.filter(sample => sample.visibleArea >= threshold);
        const smallerSurfaces = group.filter(sample => sample.visibleArea > 0 && sample.visibleArea < threshold);
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
    return samples.filter(sample => !toOmit.has(sample));
}
export function collectAdSlotSamples(options = {}) {
    const { selectors = DEFAULT_AD_SELECTORS, includeStickyDetection = true } = options;
    const viewport = VIEWPORT();
    const rawElements = selectors
        .flatMap(selector => Array.from(document.querySelectorAll(selector)))
        .filter(Boolean);
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
            if (typeof value === 'string') {
                datasetRecord[key] = value;
            }
        }
        const logicalId = deriveLogicalId(element, slotName);
        const provider = inferProvider(element);
        if (provider === 'adnami' &&
            !datasetRecord.adnmFid &&
            !datasetRecord.adnmSid &&
            !datasetRecord.adnmChannel) {
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
    const visibleSamples = filteredSamples.filter(sample => sample.isVisible && sample.visibleArea > 0);
    const deduped = new Map();
    for (const sample of visibleSamples) {
        const key = `${sample.provider}::${sample.logicalId}`;
        const existing = deduped.get(key);
        if (!existing || sample.visibleArea > existing.visibleArea) {
            deduped.set(key, sample);
        }
    }
    return Array.from(deduped.values());
}
export function getEffectiveSelectors(options) {
    if (options?.selectors && options.selectors.length > 0) {
        return options.selectors;
    }
    return DEFAULT_AD_SELECTORS;
}
//# sourceMappingURL=adCollector.js.map