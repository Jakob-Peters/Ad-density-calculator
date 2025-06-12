# 🧪 AdScore Measurement Script

> Developed by **Jakob Peters @ STEP Network**  
> **Open source** — contributions, suggestions, or improvements are **highly welcome**!  
Fork, open issues, or submit pull requests.

This script measures **AdScore and user interference** on web pages. It supports standard ad formats (Google Ad Manager, Prebid) and high-impact formats (skins, topscrolls, etc). It scrolls through the page, records ad coverage, and provides a **modular, configurable AdScore system** (0–100, 100=best) based on:

- Ad density *(enabled by default)*
- Unique ad units *(module present, disabled by default)*
- Average content distance *(module present, disabled by default)*
- Viewport coverage *(module present, disabled by default)*

A clean overlay UI displays the AdScore. **Debug info** is logged to the console (prefixed with `AdScore:`) if debug mode is enabled.

---

## ⚡️ What’s New (v2)
- **Modular, maintainable code**: Clear sections for config, state, measurement, scoring, UI, utilities, and main runner.
- **Configurable AdScore system**: All weights and thresholds are set in a `CONFIG` object.
- **Multiple scoring modules**: Ad density (enabled), unique ads, content distance, viewport coverage (all present, can be enabled/disabled in config).
- **Clean overlay UI**: Only the AdScore and factor breakdown; debug info is in the console.
- **Debug mode**: Visual overlays and detailed logs (see below).
- **Easy to extend**: Add new scoring factors or change weights easily.
- **Updated documentation**: This README reflects the new structure and usage.
- **To-Do**: Add advanced features (center/content-aligned ad weighting, above-the-fold weighting, improved debug UI module).

---

## 🚀 Features
- ✅ Scrolls the full page automatically
- ✅ Tracks visible area of **standard** and **high-impact** ads
- ✅ Calculates an **AdScore (user interference score)** (0–100, 100=best)
- ✅ Modular AdScore: ad density (enabled), unique ads, content distance, viewport coverage (modules present, disabled by default)
- ✅ **Configurable**: All weights and thresholds in one place
- ✅ **Debug mode**: Visual overlays and detailed console logs
- ✅ Clean, user-friendly overlay UI

---

## 📦 How to Use

### Chrome DevTools Console
1. Open DevTools (right-click > Inspect > Console).
2. Paste [`AdScoreCalculator.js`](./AdScoreCalculator.js) into the console and press **Enter**.
3. Wait for the script to scroll and analyze the page.
4. To enable **debug mode**, run:
   ```javascript
   runAdScoreAudit({ delay: 1500 });
   ```
   (Default: `debug: false`)

---

## 🛠️ Debug Mode - Currently disabled
- **Highlights all detected ads** with a red overlay labeled `TRACKED AD` (shows ID, size, area, % coverage).
- **All debug info** (detailed stats, IDs, calculations) is logged to the console, prefixed with `AdScore:`.
- **Overlay UI** remains clean; only a message about debug info is shown if debug mode is on.
- **Debugging UI module**: *(planned, not yet implemented)*

---

## 🧩 Code Structure
- **CONFIG**: All weights, thresholds, and selectors
- **STATE**: Tracks all measurement data
- **MEASUREMENT**: Functions to collect ad data and highlight ads (in debug mode)
- **SCORING**: Modular scoring functions for each factor (ad density enabled, others present but disabled)
- **UI/OVERLAY**: Clean overlay for the AdScore (scoring UI module); debugging UI module is a placeholder
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
3. **Calculates Modular AdScore**: For ad density (enabled), unique ads, content distance, and viewport coverage (modules present, disabled by default).
4. **Displays Final Report**: 
   - **Overlay**: AdScore and factor breakdown
   - **Console**: Detailed debug info (if enabled)

---

## ⚠️ Limitations & Caveats
- **Sticky/Floating Ads**: Measured multiple times if visible during scroll.
- **Overlapping/Large Skins**: May inflate ad area.
- **No De-duplication**: Overlapping ads stack their areas.
- **Assumes Full Scroll Height**: Dynamic content may cause skips or double-counting.
- **Selectors Are Opinionated**: Custom setups may be missed.
- **Some modules are present but disabled by default**: Enable them in the `CONFIG` object to use.
- **Debugging UI module is a planned feature**

---

## 📖 License
MIT License — free for personal or commercial use.
