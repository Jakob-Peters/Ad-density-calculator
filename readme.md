# 🧪 AdScore Measurement Script

> Developed by **Jakob Peters @ STEP Network**  
> **Open source** — contributions, suggestions, or improvements are **highly welcome**!  
Fork, open issues, or submit pull requests.

This script measures **AdScore and user interference** on web pages. It supports standard ad formats (Google Ad Manager, Prebid) and high-impact formats (skins, topscrolls, etc). It scrolls through the page, records ad coverage, and provides a **modular, configurable AdScore system** (0–100, 100=best) based on:

- Ad density
- Unique ad units
- Average content distance
- Viewport coverage

A clean overlay UI displays the AdScore. **Debug info** is logged to the console (prefixed with `AdScore:`) if debug mode is enabled.

---

## ⚡️ What’s New (v2)
- **Modular, maintainable code**: Clear sections for config, state, measurement, scoring, UI, utilities, and main runner.
- **Configurable AdScore system**: All weights and thresholds are set in a `CONFIG` object.
- **Multiple scoring factors**: Ad density, unique ads, content distance, viewport coverage.
- **Clean overlay UI**: Only the AdScore and factor breakdown; debug info is in the console.
- **Debug mode**: Visual overlays and detailed logs (see below).
- **Easy to extend**: Add new scoring factors or change weights easily.
- **Updated documentation**: This README reflects the new structure and usage.

---

## 🚀 Features
- ✅ Scrolls the full page automatically
- ✅ Tracks visible area of **standard** and **high-impact** ads
- ✅ Calculates an **AdScore (user interference score)** (0–100, 100=best)
- ✅ Modular AdScore: ad density, unique ads, content distance, viewport coverage
- ✅ **Configurable**: All weights and thresholds in one place
- ✅ **Debug mode**: Visual overlays and detailed console logs
- ✅ Clean, user-friendly overlay UI

---

## 📦 How to Use

### Chrome Bookmarks
1. Open [`bookmark_file.txt`](./bookmark_file.txt).
2. Copy the line for the desired mode (with or without debug).
3. Add it as a new bookmark in your browser.

### Chrome DevTools Console
1. Open DevTools (right-click > Inspect > Console).
2. Paste [`AdScoreCalculator.js`](./AdScoreCalculator.js) into the console and press **Enter**.
3. Wait for the script to scroll and analyze the page.
4. To enable **debug mode**, run:
   ```javascript
   runAdScoreAudit({ delay: 1500, debug: true });
   ```
   (Default: `debug: false`)

---

## 🛠️ Debug Mode
- **Highlights all detected ads** with a red overlay labeled `TRACKED AD` (shows ID, size, area, % coverage).
- **All debug info** (detailed stats, IDs, calculations) is logged to the console, prefixed with `AdScore:`.
- **Overlay UI** remains clean; only a message about debug info is shown if debug mode is on.

---

## 🧩 Code Structure
- **CONFIG**: All weights, thresholds, and selectors
- **STATE**: Tracks all measurement data
- **MEASUREMENT**: Functions to collect ad data and highlight ads (in debug mode)
- **SCORING**: Modular scoring functions for each factor
- **UI/OVERLAY**: Clean overlay for the AdScore
- **UTILITIES**: Device/browser detection, helpers
- **MAIN**: The main runner function (`runAdScoreAudit`)

---

## 📎 Selectors Used
- **Normal Ads**:  
  `div[id^="google_ads_iframe"]`, `div[id^="div-gpt-ad"]`
- **High-Impact Ads**:  
  `div[data-adnm-fid]`

---

## 📌 What It Does
1. **Detects and Measures Ads**: Standard and high-impact units using the selectors above.
2. **Scrolls Through the Page**: Viewport-by-viewport, measuring visible ad area at each step.
3. **Calculates Modular AdScore**: For ad density, unique ads, content distance, and viewport coverage.
4. **Displays Final Report**: 
   - **Overlay**: AdScore and factor breakdown
   - **Console**: Detailed debug info (if enabled)

---

## ⚙️ Example Output

**Overlay UI:**
```
AdScore (User Interference)
87 / 100
Ad Density: 12.3% (Score: 27.7)
Unique Ads: 8 (Score: 24.0)
Avg. Content Distance: 410px (Score: 18.2)
Avg. Viewport Coverage: 14.2% (Score: 17.2)
100 = Good. 0 = Bad.
(Debug info is available in the console if debug mode is enabled)
```

**Console (with debug mode):**
```
AdScore: === AD SCORE (USER INTERFERENCE) ===
AdScore: Total AdScore: 87
AdScore: Ad Density: 12.3 %
AdScore: Ad Density Score: 27.7
AdScore: Unique Ads: 8
AdScore: Unique Ads Score: 24.0
AdScore: Avg Content Distance: 410 px
AdScore: Content Distance Score: 18.2
AdScore: Avg Coverage: 14.2 %
AdScore: Coverage Score: 17.2
AdScore: Total Viewports Scrolled: 30
AdScore: Total Normal Ads Area: 14606657 px²
AdScore: Total Adnami Ads Area: 2233320 px²
AdScore: Total Ad Area: 16839977 px²
AdScore: Total Content Area (Scrolled): 83750400 px²
AdScore: Ad Density Ratio: 0.20
AdScore: Avg. Viewport Coverage: 14.2 %
AdScore: Unique Ad IDs: ad-abc123, ad-def456, ...
AdScore: Avg. Content Distance: 410 px
AdScore: All Content Distances: 0,410,820 | ...
AdScore: Total Ads Loaded: 15
```

---

## ⚠️ Limitations & Caveats
- **Sticky/Floating Ads**: Measured multiple times if visible during scroll.
- **Overlapping/Large Skins**: May inflate ad area.
- **No De-duplication**: Overlapping ads stack their areas.
- **Assumes Full Scroll Height**: Dynamic content may cause skips or double-counting.
- **Selectors Are Opinionated**: Custom setups may be missed.

---

## 📖 License
MIT License — free for personal or commercial use.
