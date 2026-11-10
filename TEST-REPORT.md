# AI Gallery Sites MVP v0.1 — actual test report

## v0.1.3 addendum (11 November 2026)

Change: G-010 added as a Mystery character (archiveOrder 9, the empty slot next to G-008). Catalog is now 10: 3 Featured + 7 Mystery, so a new visitor starts at 3/10 and finishes in 7 pulls. Copy changed from "Nine" to "Ten" (Archive intro and meta description). Assets copied byte-for-byte from `G-010_paket_1.zip` (5 WebP + crop JSON); crop JSON source matches the 2048 × 2048 master (4,644,783 bytes).

- `node --test tests/state.test.js`: 8 tests, 8 passed (counts updated to 7 Mystery / 10 owned; archive order test now checks all ten slots).
- `python3 tests/preflight.py`: 50 images decoded, 10 crop JSON validated, all 60 SHA-256 hashes match.
- Headless Chrome, 360 × 740: new visitor sees 3 / 10 (7 to discover); seven pulls gave seven different Mystery IDs including G-010 and reached 10 / 10; G-010 Detail rendered. Only error was the browser's automatic `/favicon.ico` request (404; the site has never shipped a favicon).
- Not verified on a physical Android device.

## v0.1.2 addendum (10 November 2026)

Change: Featured (G-002, G-005, G-009) are owned from the start; Summon draws only the six Mystery characters (6 pulls to 9/9). Result screen spacing from v0.1.1 retained.

- `node --test tests/state.test.js`: 8 tests, 8 passed (Summon never draws Featured; 1,000 runs of 6 pulls exhaust Mystery with no duplicates and reach 9 owned; Featured-first ownership order; legacy saves that already list a Featured ID are counted once and finish in the remaining pulls).
- Headless Chrome, 360 × 740 mobile viewport, no console/HTTP errors: new visitor sees 3 / 9 with three FEATURED cards and six Mystery slots; Featured detail reads "In your collection"; six pulls produced six different Mystery IDs with counters 4/9 to 9/9, ended on Collection, Summon showed Collection Complete, and Collection listed Featured first then discovery order. A legacy save (`["G-006","G-002"]`) showed 4 / 9 and needed 5 pulls.
- Not re-verified on a physical Android device after this change.

## v0.1.1 addendum (9 November 2026)

Changes: Mystery-first summon pool, Detail no longer repeats the ID, `<main>` focus ring removed, code reformatted with Prettier (no logic change from formatting).

- `node --test tests/state.test.js`: 7 tests, 7 passed. Old test 4 (Featured in later pool) replaced; new tests: 1,000 runs where pulls 1–6 are always Mystery and 7–9 Featured; legacy progress already containing a Featured still draws remaining Mysteries first.
- Headless Chrome, 390 × 844 mobile viewport: Archive and Detail rendered; full 9-pull run ended at Collection 9/9 with pending cleared; Summon showed Collection Complete. Example order: G-004 → G-001 → G-006 → G-008 → G-003 → G-007 → G-005 → G-009 → G-002.
- Not re-verified on a physical Android device. The original report below describes v0.1 and its pull rule.


Date: 5 November 2026 (Asia/Jakarta). This report distinguishes execution from implementation review. Production hosting was not deployed or tested. The supplied asset archive was read directly from the workspace. No artwork was regenerated, recompressed, or upscaled.

## Environment

- Node.js built-in test runner and syntax check in the provided Linux workspace.
- Python 3 + Pillow for decoding and asset/hash verification.
- Remote Chrome browser through the supported browser tool, served over HTTP by the provided static preview.
- Desktop screenshot viewport approximately 1348 × 926 CSS pixels.
- Responsive iframe viewport checks: 320 × 800, 360 × 800, 390 × 800, 430 × 800, and 800 × 360 landscape. Desktop scrollbars reduced content widths by 15 px. These are browser frame layout checks, **not physical Android or mobile browser emulation**.

## Automated checks executed — PASS

`node --test tests/state.test.js`: 5 tests, 5 passed, 0 failed.

1. Invalid/unknown/duplicate IDs are sanitized, order retained, unowned pending removed.
2. 600 first-pull interval samples all select non-Featured characters.
3. 1,000 complete randomized nine-pull simulations produce nine unique IDs; JSON round-trip retains pending; a tenth selection returns null.
4. Later selection partitions the eight remaining candidates equally by input random intervals, including Featured. This verifies selection boundaries, not a statistical randomness certification.
5. Featured set and fixed first-three-row slot registry match the locked brief.

`node --check src/app.js`: passed.

`python tests/preflight.py <original ZIP>`: passed. All 45 WebP images decoded, all 9 crop JSON IDs/schema validated, all recorded dimensions and SHA-256 hashes matched. All 54 copied files matched the supplied ZIP byte-for-byte. ZIP CRC integrity check also passed. Manifest includes mapping, sizes, dimensions and hashes. Source and deploy archives validated with ZIP CRC checks before delivery.

## Browser workflows executed

| Check | Observed result |
| --- | --- |
| Startup and initial Archive | Three public Featured plus six anonymous mystery buttons; collection 0/9. No blank app page. |
| Featured ownership separation | G-002 detail accessible at 0/9; explicitly “Available to view”, not collected. |
| Mystery explanation | Anonymous dialog with working Summon route; no character identity/artwork shown. |
| Direct mystery URL and refresh | Unowned G-001 detail remained anonymous before and after reload. |
| Detail and viewer | Portrait detail and Original viewer rendered real artwork; contain layout. |
| Zoom button | 1.0× → 1.5× visibly confirmed; repeated + capped at 4.0×, Reset returned to 1.0× after final gesture-bound fixes. |
| Viewer Back / Forward | Back closed viewer to detail; Forward reopened viewer. Rechecked after routing fixes. Also opened a fresh direct G-005/artwork URL: Back reached its detail and Forward reopened the viewer. |
| First actual pull | G-006, a Mystery character, from 0/9. |
| Refresh during reveal | Same G-006 result restored; progress remained 1/9. No reroll. |
| Skip | After correcting a selector bug, immediately revealed actions and hid Skip; explicitly checked visibility. |
| Full nine-pull workflow | G-006 → G-002 → G-001 → G-007 → G-008 → G-003 → G-005 → G-009 → G-004. Exactly nine unique IDs. |
| Completion | Result action changed to View Collection; collection showed 9/9; chamber showed Collection Complete with no Summon ×1. |
| Discovery order | Collection card labels matched the nine-pull sequence above. |
| Archive unlock | Newly owned mystery became its real Card in the existing slot. |
| Reset confirmation/cancel | Reset opened a distinct warning dialog; Keep collection returned without deleting progress. |
| Confirmed reset | Only synthetic preview test progress was reset; chamber returned to 0/9. A fresh subsequent pull gave Mystery G-008. |
| Double click | Double-clicking Summon ×1 at 1/9 acquired one character (G-006), reaching 2/9. |
| Cross-tab updates | Second tab acquisition updated first tab Archive count to 2/9 and unlocked G-006. This does not prove arbitrary race freedom. |
| Archive return scroll | After card navigation and Back, clicked-card scroll position was restored to 667 px in a repeat check. |
| Keyboard smoke | Tab moved focus from main to a real Archive character link; dialog controls appeared in accessibility tree and received focus. |
| Responsive layout | All four portrait frames had two equal card columns and scrollWidth equal to clientWidth. Fixed bottom navigation stayed inside frame bounds. Landscape also had no horizontal overflow. |

Initial CSS issues with mystery alignment/hidden buttons and the immediate-Skip selector were corrected and rechecked. A development rebuild replaced the live served folder, temporarily producing a directory listing; restarting the preview restored the app. This was a preview process issue, not a packaged route fallback. Browser logs returned extension metadata errors; these were outside the application. No claim of an exhaustive clean-console audit is made.

## Implemented and reviewed; not fully device-verified

- Pointer Events pinch (1–4×), drag bounds using actual contain-image dimensions, double-tap reset/zoom. Zoom buttons and browser Back were exercised; physical multi-touch was not.
- Reduced-motion CSS and immediate-result branch are implemented. A live OS/browser reduced-motion setting was not toggled during these tests.
- Visible image retry UI in grid/detail and viewer; pending result retained with retry/continue on failed result artwork. Fifteen-second stalled-result timeout implemented. Fault injection/network interruption tests were not executed.
- Storage denied/quota fallback uses in-memory state with a visible temporary-mode warning. Storage failures and corrupt persisted JSON were covered by code review/pure-state tests, not by a browser fault-injection test. Corrupt ID sanitization was unit-tested.
- Web Locks when available; localStorage lease fallback with token verification otherwise. Cross-tab update propagation was observed, but a simultaneous multi-tab contention stress test was not run. No claim of transactionality or atomicity for localStorage.
- Focus-visible styles, meaningful labels, 46 px button targets, safe-area bottom padding, and image dimensions/alt text are implemented. No complete screen-reader audit, contrast instrument audit, or full keyboard walkthrough was run.
- Runtime failure notice, startup registry-fetch error, JS-off explanatory message, and relative paths implemented. A subpath deployment and JavaScript-disabled browser session were not exercised.

## Not verified

Physical low/mid-tier Android performance, Android system Back gestures/hardware button, Samsung Internet, Firefox, Safari, TalkBack, multi-touch pinch/pan, app process termination, OS memory pressure, slow-device animation timing, storage eviction, private-mode retention, actual notch/safe-area behavior, production caching and production deployment. Desktop browser Back and refresh are useful checks but do not substitute for Android device tests. Full reload preserves collection/pending; scroll-position persistence is session-only.

## Screenshots

`screenshots/archive.jpg`, `detail.jpg`, `summon.jpg`, `result.jpg`, `collection.jpg`, and `responsive-frames.jpg` are actual Chrome captures. They illustrate different points in testing, so collection counts can differ. Responsive frame capture documents a layout fixture, not a real phone screenshot.

## Remaining limitations

Progress is origin-local with no account/cloud recovery. Clearing data or changing origin can lose access to previous progress. Static artwork remains publicly obtainable despite mystery UI. Display zoom does not create source resolution. Fallback cross-tab coordination is best effort. Browser-local test progress is not packaged; new visitors begin at 0/9. Physical Android playtesting is the next validation step before calling this device-certified.
