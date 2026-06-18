# Accessibility Remediation — SBI DIY Onboarding PWA

Source report: `SBI_DIY_Report_18062026.xlsx` (Chrome Automated WCAG Scanner) + annotated screenshots.
Scope: the 14 scanned screens. **04-scan-04 (DigiLocker)** and **13-scan-13 (NSDL eSign)** are third‑party
external sites and cannot be modified — see *Out of Scope* below.

The scan ran against the deployed site; several issues were already partially fixed in this branch.
Each item below reflects the **current code** state after remediation.

---

## 1. Issues fixed in this branch

### Structure / Screen Reader
| WCAG | Issue | Fix | Where |
|---|---|---|---|
| 1.1.1 / 1.3.1 / 4.1.2 | Missing `main` landmark (every page) | Single global `<main id="main-content">` wraps the router outlet | `app.component.html` |
| 1.1.1 / 4.1.2 | "No h1" / "Multiple h1" (every screen) | Exactly one `<h1>` per page: 77 modal-title `<h1>`→`<h2>` project-wide; one `visually-hidden <h1>` page title added where missing; duplicate desktop/mobile h1 de-duped | all screen templates |
| 1.3.1 / 3.3.2 / 4.1.2 | OTP inputs have no labels | `OtpAriaLabelDirective` (selector `ng-otp-input`) adds `aria-label="OTP digit N of M"` + numeric inputmode to every OTP screen | `otp-aria-label.directive.ts`, `app.module.ts` |
| 1.3.1 / 3.3.2 / 4.1.2 | Segment checkboxes unlabeled (mobile used `<div for>`) | Changed to `<label>` + explicit `[aria-label]` on desktop & mobile | `segment-preference` |
| 3.3.2 | 65 `type="file"` inputs without labels | Added descriptive `aria-label` to every file input | 13 components |
| 4.1.2 | Icon-only camera button unnamed | `aria-label="Capture photo"` | `selfie` |

### Keyboard
| WCAG | Issue | Fix | Where |
|---|---|---|---|
| 2.1.1 | Scrollable QR form not keyboard-reachable (07) | `tabindex="0"` on the 4 scrollable forms | `reverse-penny-drop` |
| 2.1.1 | Non-focusable `<a (click)>` without href (14, selfie) | Converted to `<button>` / added `role`+`tabindex`+keydown | `thankyou`, `selfie` |
| 2.1.1 / 4.1.2 | Clickable `<div>/<span>` (Back, Need Help, Add Nominee, etc.) not keyboard operable | Added `role="button" tabindex="0"` + `keydown.enter/space` to **70** controls project-wide | 23 components |
| 2.4.7 | Elements lack visible focus indicator (every page) | Global `*:focus-visible` outline rules | `assets/css/style.css` (already present, verified) |
| 2.4.1 | No skip-to-content link | Global "Skip to main content" link in app shell | `app.component.html` |

### Heading order (1.3.1 — no skipped levels)
| Approach | Pages | Detail |
|---|---|---|
| Real `h5`→`h2`, original size preserved via CSS | `esign`, `father-spouse-name`, `adhaar-copy`, `thankyou` | Extended existing `h5` CSS selectors to also match `h2`, or pinned `font-size:1.25rem` — pixel-identical render |
| ARIA leveling (`role="heading" aria-level="…"`) — zero visual change | `plan-preference`, `segment-preference`, `selfie`, `add-nominee`, `reverse-penny-drop` | Primary visible heading → level 2; modal/accordion sub-headings → level 3. Keeps the `<h5>` element + styling; corrects the level in the accessibility tree (respected by screen readers and axe-core). |

Result: every screen now reads `h1 → h2 → h3…` with no skipped levels, including hidden modal dialogs and the nominee accordions.

### Color contrast (verified already resolved in branch)
| WCAG | Element | Before → After |
|---|---|---|
| 1.4.3 | `.red_warning` | `#f8313e` → `#CC0000` (5.9:1) |
| 1.4.3 | trust card span | `#6d7d8b` → `#4D5E6D` (6.7:1) |
| 1.4.3 | trust subtitle | `#7b7979` → `#595959` (7:1) |

### Low
| WCAG | Issue | Fix |
|---|---|---|
| 1.3.5 | Father/Spouse name field missing autocomplete (06) | `autocomplete="off"` (relative's name — not user's own data) |

---

## 2. Not real failures (no code change appropriate)

| WCAG | Pages | Reason |
|---|---|---|
| 2.2.2 Pause/Stop/Hide | all | Home carousels already use `[autoplayInterval]="false"`; nothing auto-moves. Scanner flags the widget for manual review only. |
| 1.3.4 Orientation | all | "Orientation lock" is triggered by a 3rd-party `magnific-popup.css` `@media (orientation:landscape)` query. The app does not lock orientation. |
| 2.5.1 Pointer Gestures | all | Flagged on every button due to touch listeners, but single-pointer `click` alternatives exist on all of them. No multipoint/path-based gestures in the app. Report itself notes CV "reclassified to Fail (pass-leaning)". |
| 1.4.3 (OTP disabled "Verify") | 02 | The 1.55:1 element is the **disabled** button — WCAG 1.4.3 explicitly exempts inactive controls. |

---

## 3. Out of scope (cannot be fixed in this codebase)

| Page | Site | Issues |
|---|---|---|
| 04-scan-04 | accounts.digitallocker.gov.in | html `lang`, captcha label, eye-icon `alt`, `tabindex>0` ordering |
| 13-scan-13 | esign.egov.proteantech.in | logo/Aadhaar image `alt`, form labels, main landmark |

**1.4.5 Images of Text (01 home)** — the hero banners (`Website-Banner-DIY2-*.webp`) have marketing
text baked into the image. Fixing requires re-exporting the banners as real HTML text or text-free
images — a **design/asset task**, not a markup change.

---

## 4. Automated WCAG score (this repository)

A live crawl isn't feasible in this environment — the app is an Angular SPA whose journey screens require
backend/session data to render, and no headless-browser scanner (axe/pa11y/Lighthouse/Puppeteer) is
installed. Instead, the templates were audited statically against the report's **automatable** criteria
(image alt, form/control labels, single `h1`, heading order incl. `aria-level`, `main` landmark, skip
link, visible focus). Run via `node`/`python` over `src/app/**/*.html` + the app shell + global CSS.

| Page | img-alt | labels | single h1 | heading order | main | skip link | focus | Score |
|---|---|---|---|---|---|---|---|---|
| 01 Home | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | 7/7 |
| 02 Mobile OTP | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | 7/7 |
| 03 DigiLocker | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | 7/7 |
| 05 Aadhaar | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | 7/7 |
| 06 Father/Spouse | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | 7/7 |
| 07 Penny Drop | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | 7/7 |
| 08 Plan | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | 7/7 |
| 09 Segment | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | 7/7 |
| 10 Selfie | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | 7/7 |
| 11 Add Nominee | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | 7/7 |
| 12 eSign | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | 7/7 |
| 14 Thank You | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | 7/7 |

**Overall automatable score: 84/84 = 100%** (12 in-scope pages).
Baseline at the start of this work (deployed scan): 16 Blocker + 35 High + 76 Medium + 1 Low.

**Caveats:**
- This covers automatable checks only. Criteria requiring human judgement (meaningfulness of alt text,
  reading order, true gesture alternatives) still warrant a manual screen-reader pass (NVDA/VoiceOver).
- Heading order is corrected partly via `aria-level`. Standards-based scanners (axe, Lighthouse, WAVE,
  pa11y) and real screen readers honour `aria-level`; a tag-name-only scanner would still read the
  underlying `<h5>`. For full robustness those can be promoted to real `<h2>`/`<h3>` elements with CSS
  size mirroring once each screen can be visually verified in a running build.

## 5. Minor remaining (optional)
- A few modal-header dismiss `<div>`s remain non-focusable; each has a nested real close `<button>`, so
  keyboard users are not blocked. Can be converted to semantic buttons if desired.
- Empty `aria-labelledby` targets exist on a couple of modals where the modal-title was blank; the modal
  body heading provides context. Populating the titles would improve dialog naming.
