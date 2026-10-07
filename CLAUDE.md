# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

CLIF-C OF Calculator is a React 19 PWA (Progressive Web App) for calculating CLIF-C OF scores and ACLF (Acute-on-Chronic Liver Failure) grades in cirrhosis patients. The app is Korean-language, offline-capable, and deployed to Netlify.

## Commands

```bash
npm run dev       # Start Vite dev server with HMR
npm run build     # Production build → dist/
npm run preview   # Preview production build locally
npm run lint      # ESLint (flat config v9)
npm test          # Vitest — logic tests in src/logic/*.test.js
```

Run `npm test` after any change to `src/logic/` or the thresholds in `src/constants/`.

## Architecture

**Data flow:** `App.jsx` owns all state → passes down to component layer → component layer calls pure logic functions.

### Logic Layer (`src/logic/`) — pure functions, no React

| File | Responsibility |
|------|---------------|
| `validation.js` | Input range validation; derives MAP (`(SBP+2×DBP)/3` or direct entry), FiO₂ (nasal cannula `21+4×L/min`, 0–6 L, or direct %), and P/F (PaO₂) or S/F (SpO₂ — never converted to PaO₂). Ratios stay unrounded for scoring. Inputs locked by RRT / vasopressors / ventilation for respiratory failure are not required |
| `organScoring.js` | Scores each of 6 organs 1–3 (Liver, Kidney, Brain, Coagulation, Circulation, Respiratory). Organ failure = 3 points, except kidney: 2 points (Cr ≥2.0) or RRT. Respiratory: P/F >300/>200/≤200 or S/F >357/>214/≤214. Mechanical ventilation for HE → brain 3; for any other reason → respiratory 3 (Jalan 2014) |
| `aclfGrading.js` | Determines ACLF grade (No ACLF / ACLF-1 / ACLF-2 / ACLF-3) and maps to CANONIC 28-/90-day mortality |
| `prognosisScores.js` | Next-step scores on the result screen: CLIF-C ACLF (age, WBC) when ACLF, CLIF-C AD (age, WBC, Na + Cr, INR) otherwise; predicted mortality `1 − exp(−ci × exp(beta × score))` with EF CLIF calculator coefficients; AD risk groups ≤45 / 46–59 / ≥60. `getFollowUpScore` computes it from raw follow-up inputs |
| `diagnosis.js` | `buildDiagnosis(validatedInputs)` builds the result object (used for new calculations and saves); `recomputeHistoryRecord` re-runs a stored record with current rules (legacy SpO₂ records get S/F from stored SpO₂ + FiO₂) and flags `isChanged` with `savedGrade` / `savedTotalScore` — stored records are never rewritten |

**ACLF classification rules in `aclfGrading.js` (CANONIC, EASL CPG 2023):**
- ACLF-3: ≥3 organ failures
- ACLF-2: exactly 2 organ failures
- ACLF-1: single kidney failure (Cr ≥2.0 or RRT); OR single liver/coagulation/circulation/respiratory failure + kidney dysfunction (Cr 1.5–1.9) and/or HE grade 1–2; OR single brain failure + kidney dysfunction (Cr 1.5–1.9)
- No ACLF: everything else, including a single non-kidney failure without those companions

### Component Layer (`src/components/`)

- **InputForm** — collects patient lab values (Bilirubin, Creatinine, INR, BP or MAP, PaO₂/SpO₂ with FiO₂, mechanical ventilation, HE grade). `OptionToggle` is the shared segmented button for input modes
- **Results** — displays ACLF grade, 3–7 day reassessment note, per-organ breakdown (kidney Cr 1.5–1.9 and HE 1–2 shown as dysfunction), and the `FollowUpScore` next-step calculator; the follow-up inputs (`followUp`) are saved with the history record
- **History** — shows up to 10 past diagnoses stored in LocalStorage, recomputed with current rules on display/load (badge "기준 변경" when grade or total score changed), plus the saved follow-up score

### State & Persistence

- `App.jsx` holds: `activeTab`, `inputs`, `result`, `errors`, `followUp` (age/WBC/Na for the next-step score), `saveNotice`
- `src/hooks/useLocalStorage.js` — persists history (max 10 records) to `localStorage`
- All app constants (thresholds, colors, labels) live in `src/constants/index.js`

## Key Constraints

- **Medical accuracy is critical.** The scoring thresholds in `organScoring.js` and the ACLF criteria in `aclfGrading.js` must match the published EASL-CLIF consortium criteria. Do not change threshold values without verifying against the source literature.
- **No type checking** — plain JSX, no TypeScript.
- **PWA config** in `vite.config.js` (vite-plugin-pwa, generateSW, autoUpdate). Icons live in `public/` (`icon.svg`, `pwa-192x192.png`, `pwa-512x512.png`, `maskable-512x512.png` with content at 80% for the safe zone, `apple-touch-icon.png`). Changes to build output paths may break the PWA manifest.
- **Deployment:** `npm run build` → upload `dist/` to Netlify (drag & drop). Headers and the SPA redirect are in `public/_headers` / `public/_redirects` so they ship inside `dist/`; `netlify.toml` only holds build settings. `dist/` is the only build output folder (the old `deploy/` and `netlify-deploy/` snapshots were removed).
- **Version** comes from `package.json` (imported in `App.jsx` for the footer).
