# AdScore Project Comprehensive Overview

> Snapshot date: 2025-09-29  
> Primary file: `AdScoreCalculator.js`  
> This document consolidates code state, design intent, historical changes, open questions, and future roadmap gathered from recent refactors and discussion.

---
## 1. Purpose & High-Level Concept
The AdScore script programmatically scrolls a web page, measures ad presence and spatial interference, and produces a normalized 0–100 score (100 = least intrusive experience). Initially built to evaluate ad density, it evolved into a modular scoring platform with pluggable measurement dimensions.

Core current focus (active):
- Ad Density (visible ad area vs. total viewed content area)

Modules scaffolded but currently disabled / placeholder:
- Ad Count (unique ad units)
- Content Distance (spacing between ads vertically)
- Viewport Coverage (average percent of viewport occupied by ads per scroll)
- (Planned) Debugging UI overlay module

---
## 2. Evolution Timeline (Condensed)
1. Original script: Single-pass measurement; combined scroll + density computation; inline overlay with verbose info.
2. Refactor v2: Modular segmentation: CONFIG, STATE, MEASUREMENT, SCORING, UI, UTILITIES, MAIN.
3. Added nonlinear scoring for some factors (earlier iteration) then simplified current active path to linear-only ad density for focused calibration.
4. Introduced enable/disable gating (`CONFIG.enable`) and weight control per device.
5. Temporarily removed, then re-added scoring overlay; debugging overlay was simplified then deferred.
6. Current state: Only ad density contributes to score (100% weight). Other scoring functions exist as stubs returning zero.

---
## 3. Current Architecture Overview
Sections in `AdScoreCalculator.js`:
- CONFIG: Feature toggles, weights, max scores, selectors.
- STATE: Aggregated counters + per-viewport arrays.
- MEASUREMENT: DOM querying + visible area calculation during simulated scrolling.
- SCORING: Independent scorer functions; ad density active; others placeholder.
- UI MODULES: `showScoreOverlay` (active), placeholder for future `showDebugOverlay`.
- UTILITIES: Device / browser detection helpers.
- MAIN: `runAdScoreAudit` orchestrates scrolling, data capture, scoring, and UI presentation.

---
## 4. Configuration (`CONFIG`)
```js
const CONFIG = {
  enable: { adDensity: true, viewportCoverage: false, contentDistance: false, adCount: false },
  weights: { mobile: { adDensity: 1.0, viewportCoverage: 0.0, contentDistance: 0.0, adCount: 0.0 },
             desktop:{ adDensity: 1.0, viewportCoverage: 0.0, contentDistance: 0.0, adCount: 0.0 } },
  maxScores: { adDensity: 100, viewportCoverage: 0, contentDistance: 0, adCount: 0 },
  adSelectors: { normal: 'div[id^="google_ads_iframe"], div[id^="div-gpt-ad"]', adnami: 'div[data-adnm-fid]' }
  // TODO: center/content-aligned weighting
  // TODO: above-the-fold weighting
};
```
Key points:
- Module toggling via `enable` flags.
- Separate device weighting (currently identical, but structure supports divergence later).
- `maxScores` for disabled modules set to 0 (acts as guard + documentation of intended max allocations when reintroduced).

---
## 5. State Model (`state`)
```js
state.totalAdStats = {
  normalAdArea, adnamiAdArea, totalContentArea, viewportsScrolled, adsLoaded
};
state.uniqueAdIds = Set();
state.viewportAdCoverage = []; // (Placeholder: would store % per viewport if enabled)
state.adVerticalPositions = []; // (Placeholder: would store per-viewport y-positions of visible ads)
```
Only the aggregated totals are currently relevant to active scoring (ad density). Placeholder arrays remain for future reactivation without structural changes.

---
## 6. Measurement Flow
1. Controlled scrolling loop: advance by viewport height until bottom.
2. Each iteration collects visible ad rectangles (standard + Adnami / high-impact selector).
3. Visible *partial* area is computed with clipping to viewport bounds.
4. Areas accumulate into `normalAdArea`, `adnamiAdArea`; content area increments by `window.innerHeight * window.innerWidth` each viewport.
5. Unique IDs generated lazily per DOM element (`data-adId`).
6. (Debug overlay currently suppressed—only measurement logic persists.)

Important constraints / behavior:
- Sticky ads visible across multiple scrolls are counted repeatedly (inflates density intentionally or incidentally—policy decision pending).
- Overlapping high-impact units are additive (no occlusion logic yet).
- Lazy-loaded / dynamic height shifts after pass are not re-normalized.

---
## 7. Active Scoring Logic: Ad Density
Formula components:
- Raw density: `D = (normalAdArea + adnamiAdArea) / totalContentArea`.
- Linear scoring window: Best ≤ 0.30, Worst ≥ 0.85.
- Transformation:
  - If D ≤ 0.30 → Score = 100
  - If D ≥ 0.85 → Score = 0
  - Else: `Score = 100 * (1 - (D - 0.30) / (0.85 - 0.30))` where denominator = 0.55.

Interpretation: Score decays uniformly across the 55 percentage-point density band. Outside the window clamps to extremes.

---
## 8. Placeholder Scoring Modules
All return `{ value: 0, score: 0 }` for now:
- `scoreAdCount()` – would scale score inversely by number of unique ad IDs normalized by viewports scrolled.
- `scoreContentDistance()` – would calculate mean vertical gap between successive ads inside each viewport and reward larger separation.
- `scoreViewportCoverage()` – would average instantaneous % coverage per viewport (tracked in `viewportAdCoverage`).

Earlier (pre-simplification) logic included:
- Nonlinear piecewise interpolation (best / neutral / worst tiers) for density & coverage.
- Minimum floor scoring for Content Distance when > 0 spacing.
Those patterns can be reintroduced if multi-dimensional scoring resumes.

---
## 9. UI Modules
### Scoring UI (`showScoreOverlay`)
Displays:
- Total AdScore (0–100)
- Individual factor values + raw sub-scores (placeholders shown with disabled label if module off)

### Debug UI (Planned)
Planned features:
- Toggleable panel with per-viewport snapshots
- Table of ad IDs, cumulative visible area, first-seen viewport index
- Option to export JSON / CSV of raw measurement arrays

### Ad Highlight Overlay
- Red translucent overlay appended per ad element on measurement when debug mode (previous versions) was enabled. Currently measurement hook still supports `highlightAds` when `debug=true` (though the main runner now passes `false`).

---
## 10. Known Issues / Observations
| Category | Description | Planned Mitigation |
|----------|-------------|--------------------|
| Sticky Ads | Counted every viewport => inflates density | Above-the-fold weighting / persistence normalization |
| Zero Heights (historic) | Some overlays showed 0 height when measured out of viewport | Resolved by measuring only while visible |
| Overlapping Units | Double-count area (no occlusion) | Potential intersection subtraction later |
| Dynamic Content | Late-load content may shift earlier measurements | Re-scan or mutation observer enhancement |
| Performance | Full-page sequential scrolling may trigger reflows | Debounce or requestIdleCallback wrappers |
| Mobile Variation | Same weights as desktop currently | Future: differentiate thresholds per device |

---
## 11. Roadmap / TODOs
Short-Term:
- Implement debugging overlay module (`showDebugOverlay`) with structured summaries.
- Re-enable and tune: Ad Count, Content Distance, Viewport Coverage.
- Add config-driven threshold objects per metric (instead of hard-coded values in functions).

Medium-Term:
- Center/content-aligned ad weighting (e.g., penalize mid-column more strongly).
- Above-the-fold weighting (first N viewports higher impact).
- Distinguish sticky/floating vs in-flow ads (classification heuristic: CSS position / intersection tracking).
- Export function: `exportAdScoreReport()` returning JSON blob.

Long-Term:
- UI controls injection (toggle modules live).
- Historical logging (localStorage session timeline).
- Optional privacy-preserving aggregation for multi-page batch runs.

---
## 12. Usage Recap
```js
// Default run (ad density only, no debug overlays)
runAdScoreAudit({ delay: 1500 });

// (If future debug reinstated)
runAdScoreAudit({ delay: 1500, debug: true });
```
Bookmarklet approach: Wrap file contents in an IIFE and URL-encode; see prior `bookmark_file.txt` (not regenerated here).

---
## 13. Extending Scoring (Guidance)
Add a new metric:
1. Add `enable.newMetric` flag & `weights.[device].newMetric` and `maxScores.newMetric`.
2. Implement `scoreNewMetric()` returning `{ value, score }` with `score <= maxScores.newMetric`.
3. Add accumulation fields to `state` if needed.
4. Insert into `calculateTotalScore()` weighted sum.
5. Update `showScoreOverlay()` to display conditionally and label as disabled if not active.

Validation heuristic:
- Ensure each scorer is side-effect free.
- Scores should be monotonic w.r.t. a defined user experience axis.
- Keep per-metric max scores proportional to weight distribution clarity.

---
## 14. Math Reference (Linear Interpolation)
General form for mapping a raw metric `x` in [a, b] to descending score in [S_max, 0]:
```
score = S_max * (1 - (x - a) / (b - a))
```
Clamped with:
```
if (x <= a) score = S_max;
else if (x >= b) score = 0;
```
Applied to Ad Density with `a = 0.30`, `b = 0.85`, `S_max = 100`.

---
## 15. Example Output Snapshot (Current Mode)
Because only Ad Density is active:
```
AdScore
74 / 100
Ad Density: 41.2% (Score: 74.0)
(Disabled) Ad Count: 0 (Score: 0.0)
(Disabled) Avg. Content Distance: 0 (Score: 0.0)
(Disabled) Avg. Viewport Coverage: 0 (Score: 0.0)
```
(Exact numbers vary by page.)

---
## 16. Contribution Guidelines
- Open an issue before large refactors for alignment.
- Keep each scorer pure & independently testable (future: add Jest or lightweight harness).
- Avoid adding blocking network calls or external dependencies.
- Prefer configuration-driven changes over hard-coded constants.

---
## 17. License
MIT License — free for personal or commercial use.

---
## 18. Quick Next-Step Suggestions
- Reintroduce debug mode toggle parameter in main run call signature for future overlay differentiation.
- Add a minimal metrics export for CSV to help empirical threshold calibration.
- Create automated test harness using synthetic DOM (e.g., JSDOM) for predictable density scenarios.

---
*End of consolidated project overview.*
