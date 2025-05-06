let totalAdStats = {
  normalAdArea: 0,
  adnamiAdArea: 0,
  totalContentArea: 0,
  viewportsScrolled: 0,
};

// Function to calculate the visible ad area and content area per viewport
function calculateAdVisibilityOnScroll() {
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
    }
  });

  // Calculate visible ad area for Adnami ads
  adnamiAdSlots.forEach(ad => {
    const rect = ad.getBoundingClientRect();
    if (rect.top < window.innerHeight && rect.bottom > 0) {
      const visibleHeight = Math.max(0, Math.min(window.innerHeight, rect.bottom) - Math.max(0, rect.top));
      const visibleWidth = Math.max(0, Math.min(window.innerWidth, rect.right) - Math.max(0, rect.left));
      adnamiAdArea += visibleWidth * visibleHeight;
    }
  });

  // Total visible ad area for the current viewport
  const totalAdArea = normalAdArea + adnamiAdArea;

  // Update stats
  totalAdStats.normalAdArea += normalAdArea;
  totalAdStats.adnamiAdArea += adnamiAdArea;

  // Add content area to the total (only for visible portions)
  totalAdStats.totalContentArea += window.innerHeight * window.innerWidth;

  // Increase the number of scrolled viewports
  totalAdStats.viewportsScrolled++;
}

// Function to scroll through the page and measure the ad density
async function scrollAndMeasure(delay = 2000) {
  let currentScroll = 0;

  while (currentScroll + window.innerHeight < document.body.scrollHeight) {
    window.scrollTo({ top: currentScroll, behavior: "smooth" });

    await new Promise((resolve) => setTimeout(resolve, delay));
    calculateAdVisibilityOnScroll();

    currentScroll += window.innerHeight;
  }

  // Ensure we hit the very bottom once more
  window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
  await new Promise((resolve) => setTimeout(resolve, delay));
  calculateAdVisibilityOnScroll();

  // Final calculations for ad density per viewport
  const totalAdArea = totalAdStats.normalAdArea + totalAdStats.adnamiAdArea;
  const totalContentArea = totalAdStats.totalContentArea; // Total area of all viewports scrolled
  const finalAdDensityRatio = totalAdArea / totalContentArea;

  const adRatioPercent = (finalAdDensityRatio * 100).toFixed(1);
  const contentRatioPercent = (100 - adRatioPercent).toFixed(1);

  // Debugging logs
  console.log("SN: === FINAL AD DENSITY REPORT ===");
  console.log("SN: Total Viewports Scrolled:", totalAdStats.viewportsScrolled);
  console.log("SN: Total Normal Ads Area:", Math.round(totalAdStats.normalAdArea), "px²");
  console.log("SN: Total Adnami Ads Area:", Math.round(totalAdStats.adnamiAdArea), "px²");
  console.log("SN: TOTAL Ad Area:", Math.round(totalAdArea), "px²");
  console.log("SN: Total Content Area (Scrolled):", Math.round(totalContentArea), "px²");
  console.log("SN: FINAL Ad Density Ratio:", finalAdDensityRatio.toFixed(3));
  console.log(`SN: % of screen used for ads: ${adRatioPercent}%`);
  console.log(`SN: % of screen used for ads: ${contentRatioPercent}%`);
}

// Invoke the scrollAndMeasure function to start the process
scrollAndMeasure();
