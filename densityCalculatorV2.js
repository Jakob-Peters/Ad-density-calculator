let totalAdStats = {
  normalAdArea: 0,
  adnamiAdArea: 0,
  totalContentArea: 0,
  viewportsScrolled: 0,
  adsLoaded: 0, // Track the total number of ads loaded
};

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
    overlay.style.flexDirection = 'column'; // Adjust for multiple lines
    overlay.style.justifyContent = 'center';
    overlay.style.alignItems = 'center';
    overlay.style.pointerEvents = 'none';
    overlay.style.zIndex = '9999';

    // Retrieve or generate a unique ID for the ad
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

      // Store these values in the ad's dataset
      ad.dataset.width = Math.round(width);
      ad.dataset.height = Math.round(height);
      ad.dataset.area = Math.round(area);
    }

    // Calculate the percentage of the ad's area relative to the screen size
    const screenArea = window.innerWidth * window.innerHeight;
    const adPercentage = ((ad.dataset.area / screenArea) * 100).toFixed(1);

    // Add debug information to the overlay
    overlay.innerHTML = `
      <div>TRACKED AD</div>
      <div>ID: ${adId}</div>
      <div>Width: ${ad.dataset.width}px</div>
      <div>Height: ${ad.dataset.height}px</div>
      <div>Area: ${ad.dataset.area}px²</div>
      <div>Screen Coverage: ${adPercentage}%</div>
    `;

    ad.style.position = 'relative'; // Ensure the ad element has a relative position
    ad.appendChild(overlay);
  });
}

// Function to calculate the visible ad area and content area per viewport
function calculateAdVisibilityOnScroll(debug = false) {
  // Select the ad units (GPT, Prebid, and Adnami)
  const normalAdSlots = Array.from(document.querySelectorAll('div[id^="google_ads_iframe"], div[id^="div-gpt-ad"]'));
  const adnamiAdSlots = Array.from(document.querySelectorAll('div[data-adnm-fid]'));

  let normalAdArea = 0;
  let adnamiAdArea = 0;

  // Calculate visible ad area for normal ads
  normalAdSlots.forEach(ad => {
    const rect = ad.getBoundingClientRect();
    if (rect.top < window.innerHeight && rect.bottom > 0) {
      const visibleHeight = Math.max(0, Math.min(window.innerHeight, rect.bottom) - Math.max(0, rect.top));
      const visibleWidth = Math.max(0, Math.min(window.innerWidth, rect.right) - Math.max(0, rect.left));
      normalAdArea += visibleWidth * visibleHeight;

      // Store dimensions and area in the ad's dataset
      ad.dataset.width = Math.round(visibleWidth);
      ad.dataset.height = Math.round(visibleHeight);
      ad.dataset.area = Math.round(visibleWidth * visibleHeight);
    }
  });

  // Calculate visible ad area for Adnami ads
  adnamiAdSlots.forEach(ad => {
    const rect = ad.getBoundingClientRect();
    if (rect.top < window.innerHeight && rect.bottom > 0) {
      const visibleHeight = Math.max(0, Math.min(window.innerHeight, rect.bottom) - Math.max(0, rect.top));
      const visibleWidth = Math.max(0, Math.min(window.innerWidth, rect.right) - Math.max(0, rect.left));
      adnamiAdArea += visibleWidth * visibleHeight;

      // Store dimensions and area in the ad's dataset
      ad.dataset.width = Math.round(visibleWidth);
      ad.dataset.height = Math.round(visibleHeight);
      ad.dataset.area = Math.round(visibleWidth * visibleHeight);
    }
  });

  // Highlight ads if debug mode is enabled
  if (debug) {
    highlightAds([...normalAdSlots, ...adnamiAdSlots]);
  }

  // Update stats
  totalAdStats.normalAdArea += normalAdArea;
  totalAdStats.adnamiAdArea += adnamiAdArea;
  totalAdStats.totalContentArea += window.innerHeight * window.innerWidth;
  totalAdStats.viewportsScrolled++;
}

// Function to count all ad unit slots loaded onto the page using GPT.js
function countAdSlots() {
  window.googletag = window.googletag || {};
  googletag.cmd = googletag.cmd || [];
  googletag.cmd.push(() => {
    const slots = googletag.pubads().getSlots(); // Get all ad slots
    totalAdStats.adsLoaded = slots.length; // Count the total number of ad slots
  });
}

// Function to detect the device type
function getDeviceType() {
  const width = window.innerWidth;
  if (width < 768) return "Mobile";
  if (width < 1024) return "Tablet";
  return "Desktop";
}

// Function to detect the browser type
function getBrowserType() {
  const userAgent = navigator.userAgent;
  if (userAgent.includes("Chrome") && !userAgent.includes("Edg")) return "Chrome";
  if (userAgent.includes("Safari") && !userAgent.includes("Chrome")) return "Safari";
  if (userAgent.includes("Firefox")) return "Firefox";
  if (userAgent.includes("Edg")) return "Edge";
  return "Other";
}

// Function to create and display the results overlay
function showResultsOverlay(adRatioPercent, contentRatioPercent, totalAdStats) {
  const overlay = document.createElement('div');
  overlay.style.position = 'fixed';
  overlay.style.top = '50%';
  overlay.style.left = '50%';
  overlay.style.transform = 'translate(-50%, -50%)';
  overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
  overlay.style.color = 'white';
  overlay.style.zIndex = '9999';
  overlay.style.display = 'flex';
  overlay.style.flexDirection = 'column';
  overlay.style.justifyContent = 'center';
  overlay.style.alignItems = 'center';
  overlay.style.padding = '20px';
  overlay.style.boxSizing = 'border-box';

  // Apply responsive styles
  if (window.innerWidth < 728) {
    overlay.style.width = '100%'; // Mobile width
    overlay.style.height = '70%'; // Mobile height
  } else {
    overlay.style.width = '60%'; // Desktop width
    overlay.style.height = '70%'; // Desktop height
  }

  // Get device and browser information
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const deviceType = getDeviceType();
  const browserType = getBrowserType();

  overlay.innerHTML = `
    <h1 style="color: white;">Ad Density Report</h1>
    <p>Total Viewports Scrolled: ${totalAdStats.viewportsScrolled}</p>
    <p>Total Normal Ads Area: ${Math.round(totalAdStats.normalAdArea)} px²</p>
    <p>Total Adnami Ads Area: ${Math.round(totalAdStats.adnamiAdArea)} px²</p>
    <p>Total Ad Area: ${Math.round(totalAdStats.normalAdArea + totalAdStats.adnamiAdArea)} px²</p>
    <p>Total Content Area (Scrolled): ${Math.round(totalAdStats.totalContentArea)} px²</p>
    <p>Ad Density Ratio: ${(totalAdStats.normalAdArea + totalAdStats.adnamiAdArea) / totalAdStats.totalContentArea}</p>
    <p>% of screen used for ads: ${adRatioPercent}%</p>
    <p>% of screen used for content: ${contentRatioPercent}%</p>
    <p>Total Ads Loaded: ${totalAdStats.adsLoaded}</p>
    <h2 style="color: white; margin-top: 20px;">Device Information</h2>
    <p>Viewport Size: ${viewportWidth}px x ${viewportHeight}px</p>
    <p>Device Type: ${deviceType}</p>
    <p>Browser Type: ${browserType}</p>
    <button id="closeOverlay" style="margin-top: 20px; padding: 10px 20px; font-size: 16px; cursor: pointer;">Close</button>
  `;

  document.body.appendChild(overlay);

  document.getElementById('closeOverlay').addEventListener('click', () => {
    document.body.removeChild(overlay);
  });
}

// Function to scroll through the page and measure the ad density
async function scrollAndMeasure(delay = 1500, debug = false) {
  let currentScroll = 0;

  while (currentScroll + window.innerHeight < document.body.scrollHeight) {
    window.scrollTo({ top: currentScroll, behavior: "smooth" });

    await new Promise((resolve) => setTimeout(resolve, delay));
    calculateAdVisibilityOnScroll(debug);

    currentScroll += window.innerHeight;
  }

  // Ensure we hit the very bottom once more
  window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
  await new Promise((resolve) => setTimeout(resolve, delay));
  calculateAdVisibilityOnScroll(debug);

  // Count all ad slots loaded onto the page
  countAdSlots();

  // Final calculations for ad density per viewport
  const totalAdArea = Math.round(totalAdStats.normalAdArea + totalAdStats.adnamiAdArea);
  const totalContentArea = Math.round(totalAdStats.totalContentArea);
  const finalAdDensityRatio = Math.round((totalAdArea / totalContentArea) * 100);

  const adRatioPercent = finalAdDensityRatio;
  const contentRatioPercent = 100 - adRatioPercent;

  // Debugging logs
  console.log("=== FINAL AD DENSITY REPORT ===");
  console.log("Total Viewports Scrolled:", totalAdStats.viewportsScrolled);
  console.log("Total Normal Ads Area:", Math.round(totalAdStats.normalAdArea), "px²");
  console.log("Total Adnami Ads Area:", Math.round(totalAdStats.adnamiAdArea), "px²");
  console.log("TOTAL Ad Area:", totalAdArea, "px²");
  console.log("Total Content Area (Scrolled):", totalContentArea, "px²");
  console.log("FINAL Ad Density Ratio:", finalAdDensityRatio, "%");
  console.log(`% of screen used for ads: ${adRatioPercent}%`);
  console.log(`% of screen used for content: ${contentRatioPercent}%`);
  console.log("Total Ads Loaded:", totalAdStats.adsLoaded); // Log the total ads loaded

  // Show results in an overlay
  showResultsOverlay(adRatioPercent, contentRatioPercent, totalAdStats);
}

// Invoke the scrollAndMeasure function to start the process
scrollAndMeasure(1500, true); // Pass `true` to enable debug mode