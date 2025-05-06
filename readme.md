# 🧪 Ad Density Measurement Script

This script helps you **measure the percentage of a web page’s visible area that is taken up by ads** — including standard ad formats (like Google Ad Manager and Prebid) and high-impact formats like **High-Impact skins, topscrolls, midscrolls etc**.

It scrolls through the page, records how much of each viewport is covered by ads, and reports total usage vs. content. This is useful for evaluating **ad clutter**, **user experience**, or compliance with advertising density standards.

## 🚀 Features

- ✅ Automatically scrolls the full page
- ✅ Tracks visible area of **standard ads** and **Adnami formats**
- ✅ Calculates **ad density ratio** (ad area ÷ total viewport area)
- ✅ Logs total scrolled viewports, ad areas, and percentages

## 📦 How to Use

1. Open your browser DevTools (right-click > Inspect > Console tab).
2. Paste the script into the console and press **Enter**.
3. Wait for it to scroll through the page and log the final report.


## 📎 Selectors Used

- **Normal Ads**:
  - `div[id^="google_ads_iframe"]`
  - `div[id^="div-gpt-ad"]`
- **high-imapct Ads**:
  - `div[data-adnm-fid]`

## 📖 License

MIT License — free for personal or commercial use.


## 📌 What It Does

* Detects and measures ad slots on the page:

  * **Normal ads**: GPT/Prebid units using selectors like `div[id^="google_ads_iframe"]` or `div[id^="div-gpt-ad"]`.
  * **High-impact ads**: Units with `data-adnm-fid` attributes (typically skins, top-scrolls, or high-impact formats).
* Scrolls down the page viewport-by-viewport.
* At each scroll step:

  * Measures the visible area of each ad (i.e., portion inside the current viewport).
  * Accumulates the ad area over each step.
* Calculates the total area of content shown (viewports × viewport size).
* Logs a final **ad-to-content area ratio** when scrolling is complete.

---

## ⚙️ How the Script Works (Step-by-Step)

1. **Ad Area Initialization**
   A `totalAdStats` object stores cumulative areas:

   ```js
   {
     normalAdArea: 0,
     adnamiAdArea: 0,
     viewportsScrolled: 0
   }
   ```

2. **Viewport-by-Viewport Scrolling**
   The function `scrollAndMeasure()`:

   * Scrolls the page by `window.innerHeight` in steps.
   * Waits `2000ms` at each step to allow content to settle.
   * At each step, it calls `calculateAdVisibilityOnScroll()`.

3. **Per-Viewport Ad Area Measurement**
   Inside `calculateAdVisibilityOnScroll()`:

   * All currently visible ad elements are queried.
   * For each ad unit:

     * `getBoundingClientRect()` is used to get dimensions.
     * Only the **visible portion inside the viewport** is considered.
     * Ad areas are summed and added to `normalAdArea` or `adnamiAdArea`.

4. **Total Content Area**
   After scrolling:

   * Total visible content area = `window.innerWidth × window.innerHeight × viewportsScrolled`.

5. **Ad Density Ratio**

   * `finalAdDensityRatio = totalAdArea / totalContentArea`
   * If ads overflow viewports (e.g., large skins), the ratio can exceed 1.0 (i.e., >100%).

6. **Logging Output**
   A final report is logged to the console:

   ```plaintext
    SN: === FINAL AD DENSITY REPORT ===
    SN: Total Viewports Scrolled: 30
    SN: Total Normal Ads Area: 14606657 px²
    SN: Total High-Impact Ads Area: 2233320 px²
    SN: TOTAL Ad Area: 16839977 px²
    SN: Total Content Area (Scrolled): 83750400 px²
    SN: FINAL Ad Density Ratio: 0.201
    SN: % of screen used for ads: 20.1%
    SN: % of screen used for content: 79.9%
   ```
