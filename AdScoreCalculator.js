// =====================
// CONFIGURATION
// =====================
const CONFIG = {
  enable: {
    adDensity: true,
    viewportCoverage: false,
    contentDistance: false,
    adCount: false
  },
  weights: {
    mobile: {
      adDensity: 1.0,            // 100% of total AdScore
      viewportCoverage: 0.0,
      contentDistance: 0.0,
      adCount: 0.0
    },
    desktop: {
      adDensity: 1.0,            // 100%
      viewportCoverage: 0.0,
      contentDistance: 0.0,
      adCount: 0.0
    }
  },
  maxScores: {
    adDensity: 100,
    viewportCoverage: 0,
    contentDistance: 0,
    adCount: 0
  },
  adSelectors: {
    normal: 'div[id^="google_ads_iframe"], div[id^="div-gpt-ad"]',
    adnami: 'div[data-adnm-fid]'
  }
  // TODO: Add config for center/content-aligned ads (e.g. 30vw-60vw)
  // TODO: Add config for above-the-fold weighting
};

// =====================
// STATE
// =====================
const state = {
  totalAdStats: {
    normalAdArea: 0,
    adnamiAdArea: 0,
    totalContentArea: 0,
    viewportsScrolled: 0,
    adsLoaded: 0
  },
  uniqueAdIds: new Set(),
  viewportAdCoverage: [],
  adVerticalPositions: []
};

function resetState() {
  state.totalAdStats = {
    normalAdArea: 0,
    adnamiAdArea: 0,
    totalContentArea: 0,
    viewportsScrolled: 0,
    adsLoaded: 0
  };
  state.uniqueAdIds = new Set();
  state.viewportAdCoverage = [];
  state.adVerticalPositions = [];
}

// =====================
// MEASUREMENT
// =====================
function highlightAds(adElements) {
  adElements.forEach(ad => {
    const overlay = document.createElement('div');
    overlay.style.position = 'absolute';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100%';
    overlay.style.height = '100%';
    overlay.style.backgroundColor = 'rgb(180, 0, 0)';
    overlay.style.color = 'white';
    overlay.style.fontSize = '12px';
    overlay.style.fontWeight = 'bold';
    overlay.style.display = 'flex';
    overlay.style.flexDirection = 'column';
    overlay.style.justifyContent = 'center';
    overlay.style.alignItems = 'center';
    overlay.style.pointerEvents = 'none';
    overlay.style.zIndex = '9999';
    if (!ad.dataset.adId) {
      ad.dataset.adId = `ad-${Math.random().toString(36).substr(2, 9)}`;
    }
    const adId = ad.dataset.adId;
    // Retrieve or calculate dimensions and area
    const rect = ad.getBoundingClientRect();
    if (!ad.dataset.width || !ad.dataset.height || !ad.dataset.area) {
      const width = Math.max(0, Math.min(window.innerWidth, rect.right) - Math.max(0, rect.left));
      const height = Math.max(0, Math.min(window.innerHeight, rect.bottom) - Math.max(0, rect.top));
      const area = width * height;
      ad.dataset.width = Math.round(width);
      ad.dataset.height = Math.round(height);
      ad.dataset.area = Math.round(area);
    }
    // Calculate the percentage of the ad's area relative to the screen size
    const screenArea = window.innerWidth * window.innerHeight;
    const adPercentage = ((ad.dataset.area / screenArea) * 100).toFixed(1);
    overlay.innerHTML = `
      <div>TRACKED AD</div>
      <div>ID: ${adId}</div>
      <div>Width: ${ad.dataset.width}px</div>
      <div>Height: ${ad.dataset.height}px</div>
      <div>Area: ${ad.dataset.area}px²</div>
      <div>Screen Coverage: ${adPercentage}%</div>
    `;
    ad.style.position = 'relative';
    ad.appendChild(overlay);
  });
}

function collectAdData(debug = false) {
  const normalAdSlots = Array.from(document.querySelectorAll(CONFIG.adSelectors.normal));
  const adnamiAdSlots = Array.from(document.querySelectorAll(CONFIG.adSelectors.adnami));
  let normalAdArea = 0;
  let adnamiAdArea = 0;
  if (debug) {
    highlightAds([...normalAdSlots, ...adnamiAdSlots]);
  }
  normalAdSlots.forEach(ad => {
    const rect = ad.getBoundingClientRect();
    if (rect.top < window.innerHeight && rect.bottom > 0) {
      const visibleHeight = Math.max(0, Math.min(window.innerHeight, rect.bottom) - Math.max(0, rect.top));
      const visibleWidth = Math.max(0, Math.min(window.innerWidth, rect.right) - Math.max(0, rect.left));
      normalAdArea += visibleWidth * visibleHeight;
      if (!ad.dataset.adId) {
        ad.dataset.adId = `ad-${Math.random().toString(36).substr(2, 9)}`;
      }
      state.uniqueAdIds.add(ad.dataset.adId);
    }
  });
  adnamiAdSlots.forEach(ad => {
    const rect = ad.getBoundingClientRect();
    if (rect.top < window.innerHeight && rect.bottom > 0) {
      const visibleHeight = Math.max(0, Math.min(window.innerHeight, rect.bottom) - Math.max(0, rect.top));
      const visibleWidth = Math.max(0, Math.min(window.innerWidth, rect.right) - Math.max(0, rect.left));
      adnamiAdArea += visibleWidth * visibleHeight;
      if (!ad.dataset.adId) {
        ad.dataset.adId = `ad-${Math.random().toString(36).substr(2, 9)}`;
      }
      state.uniqueAdIds.add(ad.dataset.adId);
    }
  });
  const viewportArea = window.innerHeight * window.innerWidth;
  state.totalAdStats.normalAdArea += normalAdArea;
  state.totalAdStats.adnamiAdArea += adnamiAdArea;
  state.totalAdStats.totalContentArea += viewportArea;
  state.totalAdStats.viewportsScrolled++;
}

function countAdSlots() {
  // Disabled for now
}

// =====================
// SCORING
// =====================
function scoreAdDensity() {
  const adDensity = (state.totalAdStats.normalAdArea + state.totalAdStats.adnamiAdArea) / state.totalAdStats.totalContentArea;
  // Linear: <30% = best (100), >85% = worst (0)
  let score;
  if (adDensity <= 0.3) {
    score = CONFIG.maxScores.adDensity;
  } else if (adDensity >= 0.85) {
    score = 0;
  } else {
    // Linear interpolation between 30% and 85%
    score = CONFIG.maxScores.adDensity * (1 - (adDensity - 0.3) / 0.55);
  }
  return {
    value: adDensity,
    score
  };
}

function scoreAdCount() {
  // Placeholder for ad count scoring logic
  return { value: 0, score: 0 };
}

function scoreContentDistance() {
  // Placeholder for content distance scoring logic
  return { value: 0, score: 0 };
}

function scoreViewportCoverage() {
  // Placeholder for viewport coverage scoring logic
  return { value: 0, score: 0 };
}

function calculateTotalScore() {
  const deviceType = getDeviceType().toLowerCase();
  const weights = deviceType === 'mobile' ? CONFIG.weights.mobile : CONFIG.weights.desktop;
  let adDensity = { value: 0, score: 0 };
  let adCount = { value: 0, score: 0 };
  let contentDistance = { value: 0, score: 0 };
  let viewportCoverage = { value: 0, score: 0 };
  if (CONFIG.enable.adDensity) adDensity = scoreAdDensity();
  if (CONFIG.enable.adCount) adCount = scoreAdCount();
  if (CONFIG.enable.contentDistance) contentDistance = scoreContentDistance();
  if (CONFIG.enable.viewportCoverage) viewportCoverage = scoreViewportCoverage();
  // Only adDensity is enabled by default
  const totalAdScore = Math.max(0, Math.round(
    adDensity.score * weights.adDensity +
    adCount.score * weights.adCount +
    contentDistance.score * weights.contentDistance +
    viewportCoverage.score * weights.viewportCoverage
  ));
  return {
    totalAdScore,
    adDensity: (adDensity.value * 100).toFixed(1),
    adDensityScore: adDensity.score.toFixed(1),
    adCount: adCount.value,
    adCountScore: adCount.score.toFixed(1),
    avgContentDistance: contentDistance.value,
    contentDistanceScore: contentDistance.score.toFixed(1),
    avgCoverage: viewportCoverage.value,
    coverageScore: viewportCoverage.score.toFixed(1)
  };
}

// =====================
// UTILITIES
// =====================
function getDeviceType() {
  const width = window.innerWidth;
  if (width < 768) return "Mobile";
  if (width < 1024) return "Tablet";
  return "Desktop";
}
function getBrowserType() {
  const userAgent = navigator.userAgent;
  if (userAgent.includes("Chrome") && !userAgent.includes("Edg")) return "Chrome";
  if (userAgent.includes("Safari") && !userAgent.includes("Chrome")) return "Safari";
  if (userAgent.includes("Firefox")) return "Firefox";
  if (userAgent.includes("Edg")) return "Edge";
  return "Other";
}

// =====================
// UI/OVERLAY MODULES
// =====================

// Scoring UI (normal user-facing overlay)
function showScoreOverlay(scoreObj) {
  const old = document.getElementById('userInterferenceScoreOverlay');
  if (old) old.remove();
  const overlay = document.createElement('div');
  overlay.id = 'userInterferenceScoreOverlay';
  overlay.style.position = 'fixed';
  overlay.style.top = '50%';
  overlay.style.left = '50%';
  overlay.style.transform = 'translate(-50%, -50%)';
  overlay.style.backgroundColor = 'rgba(30,30,30,0.97)';
  overlay.style.color = 'white';
  overlay.style.zIndex = '10000';
  overlay.style.padding = '32px 40px';
  overlay.style.borderRadius = '16px';
  overlay.style.boxShadow = '0 4px 32px rgba(0,0,0,0.4)';
  overlay.style.fontFamily = 'system-ui, sans-serif';
  overlay.style.maxWidth = '90vw';
  overlay.style.display = 'flex';
  overlay.style.flexDirection = 'column';
  overlay.style.alignItems = 'center';
  let html = `
    <h2 style="margin-top:0;color:#ffb300;">AdScore</h2>
    <div style="font-size:2em;font-weight:bold;margin-bottom:10px;">${scoreObj.totalAdScore} / 100</div>
    <ul style="list-style:none;padding:0;margin:0 0 10px 0;">
      <li><b>Ad Density:</b> ${scoreObj.adDensity}% <span style="color:#aaa;">(Score: ${scoreObj.adDensityScore})</span></li>
      <li><b>(Disabled) Ad Count:</b> ${scoreObj.adCount} <span style="color:#aaa;">(Score: ${scoreObj.adCountScore})</span></li>
      <li><b>(Disabled) Avg. Content Distance:</b> ${scoreObj.avgContentDistance} <span style="color:#aaa;">(Score: ${scoreObj.contentDistanceScore})</span></li>
      <li><b>(Disabled) Avg. Viewport Coverage:</b> ${scoreObj.avgCoverage} <span style="color:#aaa;">(Score: ${scoreObj.coverageScore})</span></li>
    </ul>
    <div style="font-size:0.95em;color:#bbb;margin-bottom:10px;">100 = Good. <br>0 = Bad.</div>
  `;
  html += `<button id="closeUIScoreOverlay" style="margin-top:18px;padding:8px 22px;font-size:1.1em;cursor:pointer;background:#444;color:#fff;border:none;border-radius:8px;">Close</button>`;
  overlay.innerHTML = html;
  document.body.appendChild(overlay);
  document.getElementById('closeUIScoreOverlay').onclick = () => overlay.remove();
}

// Debugging UI (placeholder for future implementation)
// function showDebugOverlay(debugInfo) {
//   // TODO: Implement debugging overlay UI
// }

// =====================
// MAIN
// =====================
async function runAdScoreAudit({ delay = 1500 }) {
  resetState();
  let currentScroll = 0;
  while (currentScroll + window.innerHeight < document.body.scrollHeight) {
    window.scrollTo({ top: currentScroll, behavior: "smooth" });
    await new Promise((resolve) => setTimeout(resolve, delay));
    collectAdData(false);
    currentScroll += window.innerHeight;
  }
  window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
  await new Promise((resolve) => setTimeout(resolve, delay));
  collectAdData(false);
  // countAdSlots(); // Disabled for now
  const adScore = calculateTotalScore();
  showScoreOverlay(adScore);
}

runAdScoreAudit({ delay: 1500 });