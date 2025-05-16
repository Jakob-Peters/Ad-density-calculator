// =====================
// CONFIGURATION
// =====================
const CONFIG = {
  weights: {
    adDensity: 0.3,         // 30% of total AdScore
    uniqueAds: 0.3,         // 30%
    contentDistance: 0.2,   // 20%
    viewportCoverage: 0.2   // 20%
  },
  maxScores: {
    adDensity: 30,
    uniqueAds: 30,
    contentDistance: 20,
    viewportCoverage: 20
  },
  adSelectors: {
    normal: 'div[id^="google_ads_iframe"], div[id^="div-gpt-ad"]',
    adnami: 'div[data-adnm-fid]'
  }
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
    const rect = ad.getBoundingClientRect();
    if (!ad.dataset.width || !ad.dataset.height || !ad.dataset.area) {
      const width = Math.max(0, Math.min(window.innerWidth, rect.right) - Math.max(0, rect.left));
      const height = Math.max(0, Math.min(window.innerHeight, rect.bottom) - Math.max(0, rect.top));
      const area = width * height;
      ad.dataset.width = Math.round(width);
      ad.dataset.height = Math.round(height);
      ad.dataset.area = Math.round(area);
    }
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
  let adAreaThisScroll = 0;
  let adTops = [];
  normalAdSlots.forEach(ad => {
    const rect = ad.getBoundingClientRect();
    if (rect.top < window.innerHeight && rect.bottom > 0) {
      const visibleHeight = Math.max(0, Math.min(window.innerHeight, rect.bottom) - Math.max(0, rect.top));
      const visibleWidth = Math.max(0, Math.min(window.innerWidth, rect.right) - Math.max(0, rect.left));
      normalAdArea += visibleWidth * visibleHeight;
      adAreaThisScroll += visibleWidth * visibleHeight;
      adTops.push(rect.top < 0 ? 0 : rect.top);
      if (!ad.dataset.adId) {
        ad.dataset.adId = `ad-${Math.random().toString(36).substr(2, 9)}`;
      }
      state.uniqueAdIds.add(ad.dataset.adId);
      ad.dataset.width = Math.round(visibleWidth);
      ad.dataset.height = Math.round(visibleHeight);
      ad.dataset.area = Math.round(visibleWidth * visibleHeight);
    }
  });
  adnamiAdSlots.forEach(ad => {
    const rect = ad.getBoundingClientRect();
    if (rect.top < window.innerHeight && rect.bottom > 0) {
      const visibleHeight = Math.max(0, Math.min(window.innerHeight, rect.bottom) - Math.max(0, rect.top));
      const visibleWidth = Math.max(0, Math.min(window.innerWidth, rect.right) - Math.max(0, rect.left));
      adnamiAdArea += visibleWidth * visibleHeight;
      adAreaThisScroll += visibleWidth * visibleHeight;
      adTops.push(rect.top < 0 ? 0 : rect.top);
      if (!ad.dataset.adId) {
        ad.dataset.adId = `ad-${Math.random().toString(36).substr(2, 9)}`;
      }
      state.uniqueAdIds.add(ad.dataset.adId);
      ad.dataset.width = Math.round(visibleWidth);
      ad.dataset.height = Math.round(visibleHeight);
      ad.dataset.area = Math.round(visibleWidth * visibleHeight);
    }
  });
  if (debug) {
    highlightAds([...normalAdSlots, ...adnamiAdSlots]);
  }
  const viewportArea = window.innerHeight * window.innerWidth;
  const coveragePercent = viewportArea > 0 ? (adAreaThisScroll / viewportArea) * 100 : 0;
  state.viewportAdCoverage.push(coveragePercent);
  adTops.sort((a, b) => a - b);
  state.adVerticalPositions.push(adTops);
  state.totalAdStats.normalAdArea += normalAdArea;
  state.totalAdStats.adnamiAdArea += adnamiAdArea;
  state.totalAdStats.totalContentArea += viewportArea;
  state.totalAdStats.viewportsScrolled++;
}

function countAdSlots() {
  window.googletag = window.googletag || {};
  googletag.cmd = googletag.cmd || [];
  googletag.cmd.push(() => {
    const slots = googletag.pubads().getSlots();
    state.totalAdStats.adsLoaded = slots.length;
  });
}

// =====================
// SCORING
// =====================
function scoreAdDensity() {
  const adDensity = (state.totalAdStats.normalAdArea + state.totalAdStats.adnamiAdArea) / state.totalAdStats.totalContentArea;
  const rawScore = Math.min(adDensity * 100, CONFIG.maxScores.adDensity);
  return {
    value: adDensity,
    score: CONFIG.maxScores.adDensity - rawScore // Higher is better
  };
}

function scoreUniqueAds() {
  const uniqueAds = state.uniqueAdIds.size;
  const rawScore = Math.min(uniqueAds * 3, CONFIG.maxScores.uniqueAds);
  return {
    value: uniqueAds,
    score: CONFIG.maxScores.uniqueAds - rawScore // Higher is better
  };
}

function scoreContentDistance() {
  let allDistances = [];
  state.adVerticalPositions.forEach(tops => {
    for (let i = 1; i < tops.length; i++) {
      allDistances.push(tops[i] - (tops[i - 1]));
    }
  });
  let avgDistance = 0;
  if (allDistances.length > 0) {
    avgDistance = allDistances.reduce((a, b) => a + b, 0) / allDistances.length;
  }
  let contentDistanceScore = 0;
  if (avgDistance > 0) {
    const percentOfViewport = avgDistance / window.innerHeight;
    contentDistanceScore = Math.max(0, CONFIG.maxScores.contentDistance - percentOfViewport * CONFIG.maxScores.contentDistance);
  } else {
    contentDistanceScore = CONFIG.maxScores.contentDistance;
  }
  return {
    value: avgDistance,
    score: contentDistanceScore
  };
}

function scoreViewportCoverage() {
  let avgCoverage = 0;
  if (state.viewportAdCoverage.length > 0) {
    avgCoverage = state.viewportAdCoverage.reduce((a, b) => a + b, 0) / state.viewportAdCoverage.length;
  }
  const rawScore = Math.min(avgCoverage * 0.2, CONFIG.maxScores.viewportCoverage);
  return {
    value: avgCoverage,
    score: CONFIG.maxScores.viewportCoverage - rawScore // Higher is better
  };
}

function calculateTotalScore() {
  const adDensity = scoreAdDensity();
  const uniqueAds = scoreUniqueAds();
  const contentDistance = scoreContentDistance();
  const viewportCoverage = scoreViewportCoverage();
  const totalAdScore = Math.max(0, Math.round(
    adDensity.score + uniqueAds.score + contentDistance.score + viewportCoverage.score
  ));
  return {
    totalAdScore,
    adDensity: (adDensity.value * 100).toFixed(1),
    adDensityScore: adDensity.score.toFixed(1),
    uniqueAds: uniqueAds.value,
    uniqueAdsScore: uniqueAds.score.toFixed(1),
    avgContentDistance: contentDistance.value.toFixed(1),
    contentDistanceScore: contentDistance.score.toFixed(1),
    avgCoverage: viewportCoverage.value.toFixed(1),
    coverageScore: viewportCoverage.score.toFixed(1)
  };
}

// =====================
// UI/OVERLAY
// =====================
function showScoreOverlay(scoreObj, debug = false) {
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
  overlay.style.maxWidth = '420px';
  overlay.style.display = 'flex';
  overlay.style.flexDirection = 'column';
  overlay.style.alignItems = 'center';
  let html = `
    <h2 style="margin-top:0;color:#ffb300;">AdScore (User Interference)</h2>
    <div style="font-size:2.5em;font-weight:bold;margin-bottom:10px;">${scoreObj.totalAdScore} / 100</div>
    <ul style="list-style:none;padding:0;margin:0 0 10px 0;">
      <li><b>Ad Density:</b> ${scoreObj.adDensity}% <span style="color:#aaa;">(Score: ${scoreObj.adDensityScore})</span></li>
      <li><b>Unique Ads:</b> ${scoreObj.uniqueAds} <span style="color:#aaa;">(Score: ${scoreObj.uniqueAdsScore})</span></li>
      <li><b>Avg. Content Distance:</b> ${scoreObj.avgContentDistance}px <span style="color:#aaa;">(Score: ${scoreObj.contentDistanceScore})</span></li>
      <li><b>Avg. Viewport Coverage:</b> ${scoreObj.avgCoverage}% <span style="color:#aaa;">(Score: ${scoreObj.coverageScore})</span></li>
    </ul>
    <div style="font-size:0.95em;color:#bbb;margin-bottom:10px;">100 = Good. <br>0 = Bad.</div>
  `;
  if (debug) {
    html += `<div style='color:#ffb300;font-size:1em;margin-top:10px;'>Debug info is available in the console. </br> Look for logs prefixed with <b>AdScore:</b></div>`;
  }
  html += `<button id="closeUIScoreOverlay" style="margin-top:18px;padding:8px 22px;font-size:1.1em;cursor:pointer;background:#444;color:#fff;border:none;border-radius:8px;">Close</button>`;
  overlay.innerHTML = html;
  document.body.appendChild(overlay);
  document.getElementById('closeUIScoreOverlay').onclick = () => overlay.remove();
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
// MAIN
// =====================
async function runAdScoreAudit({ delay = 1500, debug = false }) {
  resetState();
  let currentScroll = 0;
  while (currentScroll + window.innerHeight < document.body.scrollHeight) {
    window.scrollTo({ top: currentScroll, behavior: "smooth" });
    await new Promise((resolve) => setTimeout(resolve, delay));
    collectAdData(debug);
    currentScroll += window.innerHeight;
  }
  window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
  await new Promise((resolve) => setTimeout(resolve, delay));
  collectAdData(debug);
  countAdSlots();
  // Remove all overlay except the scoring overlay
  const adScore = calculateTotalScore();
  if (debug) {
    // Print debug info to the console only
    console.log("AdScore: === AD SCORE (USER INTERFERENCE) ===");
    console.log("AdScore: Total AdScore:", adScore.totalAdScore);
    console.log("AdScore: Ad Density:", adScore.adDensity, "%");
    console.log("AdScore: Ad Density Score:", adScore.adDensityScore);
    console.log("AdScore: Unique Ads:", adScore.uniqueAds);
    console.log("AdScore: Unique Ads Score:", adScore.uniqueAdsScore);
    console.log("AdScore: Avg Content Distance:", adScore.avgContentDistance, "px");
    console.log("AdScore: Content Distance Score:", adScore.contentDistanceScore);
    console.log("AdScore: Avg Coverage:", adScore.avgCoverage, "%");
    console.log("AdScore: Coverage Score:", adScore.coverageScore);
    console.log("AdScore: Total Viewports Scrolled:", state.totalAdStats.viewportsScrolled);
    console.log("AdScore: Total Normal Ads Area:", Math.round(state.totalAdStats.normalAdArea), "px²");
    console.log("AdScore: Total Adnami Ads Area:", Math.round(state.totalAdStats.adnamiAdArea), "px²");
    console.log("AdScore: Total Ad Area:", Math.round(state.totalAdStats.normalAdArea + state.totalAdStats.adnamiAdArea), "px²");
    console.log("AdScore: Total Content Area (Scrolled):", Math.round(state.totalAdStats.totalContentArea), "px²");
    console.log("AdScore: Ad Density Ratio:", (state.totalAdStats.normalAdArea + state.totalAdStats.adnamiAdArea) / state.totalAdStats.totalContentArea);
    console.log("AdScore: Avg. Viewport Coverage:", adScore.avgCoverage, "%");
    console.log("AdScore: Unique Ad IDs:", Array.from(state.uniqueAdIds).join(', '));
    console.log("AdScore: Avg. Content Distance:", adScore.avgContentDistance, "px");
    console.log("AdScore: All Content Distances:", state.adVerticalPositions.map(tops => tops.join(',')).join(' | '));
    console.log("AdScore: Total Ads Loaded:", state.totalAdStats.adsLoaded);
  }
  showScoreOverlay(adScore, debug);
}

runAdScoreAudit({ delay: 1500, debug: true });