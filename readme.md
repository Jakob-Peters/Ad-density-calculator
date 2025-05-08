# 🧪 Ad Density Measurement Script

> Developed by **Jakob Peters @ STEP Network**  
> It’s an **open source** project — contributions, suggestions, or improvements are **highly welcome**!  
Feel free to fork the repo, open issues, or submit pull requests.

This script helps you **measure the percentage of a web page’s visible area that is taken up by ads** — including standard ad formats (like Google Ad Manager and Prebid) and high-impact formats like **High-Impact skins, topscrolls, midscrolls, etc**.

It scrolls through the page, records how much of each viewport is covered by ads, and reports total usage vs. content. This is useful for evaluating **ad clutter**, **user experience**, or compliance with advertising density standards.

---

## ⚠️ Limitations & Caveats

While this script gives a helpful estimation of ad density, please note the following limitations:

- **Sticky or Floating Ads**: Ads that remain fixed on the screen while scrolling will be measured **multiple times**, possibly inflating the total ad area.
- **Overlapping or Large Skins**: Some high-impact formats may **extend outside their container**, leading to calculated ad area exceeding the actual viewport space.
- **Viewport Overflow**: In edge cases, total ad area may exceed total scrolled content area, resulting in >100% ad density.
- **No De-duplication**: Overlapping ads are not deduplicated, so their areas will stack.
- **Assumes Full Scroll Height**: The script scrolls in fixed steps. Dynamic content changes may cause skipped or double-counted areas.
- **Ad Selectors Are Opinionated**: Only specific ad selector patterns are targeted. Custom or non-standard setups may be missed.

---

## 🚀 Features

- ✅ Automatically scrolls the full page
- ✅ Tracks visible area of **standard ads** and **High-Impact formats**
- ✅ Calculates **ad density ratio** (ad area ÷ total viewport area)
- ✅ Logs total scrolled viewports, ad areas, and percentages
- ✅ **Debug Mode**: Highlights detected ads with a red overlay labeled "TRACKED AD"
- ✅ Displays **viewport size**, **device type**, and **browser type** in the final overlay

---

## 📦 How to Use

### Using Chrome Bookmarks
1. Open the file [`bookmark_file.txt`](./bookmark_file.txt).
2. Copy the full line for the desired mode (with or without debugging).
3. Add it as a new bookmark in your browser's bookmark manager.

### Using Chrome DevTools Console
1. Open your browser DevTools (right-click > Inspect > Console tab).
2. Paste the script [`densityCalculatorV2.js`](./densityCalculatorV2.js). into the console and press **Enter**.
3. Wait for it to scroll through the page and log the final report.
4. To enable **debug mode**, invoke the script with the `debug` parameter set to `true`:
   ```javascript
   scrollAndMeasure(1500, true);
   ```

---

## 🛠️ Debug Mode

When enabled, **debug mode** visually highlights all detected ads on the page. Each ad is overlaid with a **50% transparent red box** labeled `"TRACKED AD"`, along with:

- The ad's unique ID
- Its width, height, and total area
- The percentage of the screen it occupies

---

## 📎 Selectors Used

- **Normal Ads**:
  - `div[id^="google_ads_iframe"]`
  - `div[id^="div-gpt-ad"]`
- **High-Impact Ads**:
  - `div[data-adnm-fid]`

---

## 📌 What It Does

1. **Detects and Measures Ads**:
   - **Normal ads**: GPT/Prebid units using selectors like `div[id^="google_ads_iframe"]` or `div[id^="div-gpt-ad"]`.
   - **High-impact ads**: Units with `data-adnm-fid` attributes (e.g., skins, top-scrolls).

2. **Scrolls Through the Page**:
   - Scrolls viewport-by-viewport in fixed steps.
   - Measures the visible area of each ad at every step.

3. **Calculates Ad Density**:
   - Total visible content area = `window.innerWidth × window.innerHeight × viewportsScrolled`.
   - Ad density ratio = `totalAdArea / totalContentArea`.

4. **Displays Final Report**:
   - Logs a detailed report to the console.
   - Shows an overlay with:
     - Total viewports scrolled
     - Total ad areas (normal and high-impact)
     - Ad density ratio
     - Viewport size, device type, and browser type

---

## ⚙️ Example Output

```plaintext
=== FINAL AD DENSITY REPORT ===
Total Viewports Scrolled: 30
Total Normal Ads Area: 14606657 px²
Total High-Impact Ads Area: 2233320 px²
TOTAL Ad Area: 16839977 px²
Total Content Area (Scrolled): 83750400 px²
FINAL Ad Density Ratio: 20%
% of screen used for ads: 20%
% of screen used for content: 80%
Total Ads Loaded: 15
Viewport Size: 1920px x 1080px
Device Type: Desktop
Browser Type: Chrome
```

---

## 📖 License

This project is licensed under the **MIT License** — free for personal or commercial use.
