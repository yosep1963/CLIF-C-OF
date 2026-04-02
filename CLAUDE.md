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
```

No test framework is configured.

## Architecture

**Data flow:** `App.jsx` owns all state → passes down to component layer → component layer calls pure logic functions.

### Logic Layer (`src/logic/`) — pure functions, no React

| File | Responsibility |
|------|---------------|
| `validation.js` | Input range validation; derives P/F ratio (`PaO₂/FiO₂`), MAP (`(SBP+2×DBP)/3`), estimated PaO₂ from SpO₂ |
| `organScoring.js` | Scores each of 6 organs (1=normal, 2=warning, 3=failure): Liver, Kidney, Brain, Coagulation, Circulation, Respiratory |
| `aclfGrading.js` | Determines ACLF grade (No ACLF / ACLF-1 / ACLF-2 / ACLF-3) and maps to 28-day mortality estimate |

**ACLF classification rules in `aclfGrading.js`:**
- ACLF-3: ≥3 organ failures
- ACLF-2: exactly 2 organ failures
- ACLF-1: single kidney failure; OR 1 organ failure + mild renal dysfunction/HE; OR moderate renal dysfunction alone

### Component Layer (`src/components/`)

- **InputForm** — collects patient lab values (Bilirubin, Creatinine, INR, BP, O₂ metrics, HE grade)
- **Results** — displays ACLF grade, per-organ breakdown, and mortality estimate
- **History** — shows up to 10 past diagnoses stored in LocalStorage

### State & Persistence

- `App.jsx` holds: `activeTab`, `inputs`, `result`, `errors`
- `src/hooks/useLocalStorage.js` — persists history (max 10 records) to `localStorage`
- All app constants (thresholds, colors, labels) live in `src/constants/index.js`

## Key Constraints

- **Medical accuracy is critical.** The scoring thresholds in `organScoring.js` and the ACLF criteria in `aclfGrading.js` must match the published EASL-CLIF consortium criteria. Do not change threshold values without verifying against the source literature.
- **No type checking** — plain JSX, no TypeScript.
- **PWA config** in `vite.config.js` includes Workbox service worker and Google Fonts caching. Changes to build output paths may break PWA manifest.
- **Deployment:** Netlify auto-builds from `main`. SPA routing (`/* → /index.html`) is configured in `netlify.toml`.
