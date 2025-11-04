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
    const key = candidates.find(value => typeof value === 'string' && value.trim().length > 0);
    return key ?? slot.id;
}
function isStickySlot(slot) {
    if (slot.isSticky) {
        return true;
    }
    const dataset = slot.dataset;
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
    const slotName = slot.slotName ?? '';
    if (slotName.toLowerCase().includes('sticky')) {
        return true;
    }
    return false;
}
export function computeAdDensity(context) {
    const { config, run } = context;
    const { thresholds } = config;
    let dynamicVisibleAdArea = 0;
    let totalContentArea = 0;
    let unclampedVisibleAdArea = 0;
    let clampedSamples = 0;
    const stickyMaxArea = new Map();
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
//# sourceMappingURL=adDensity.js.map