# PMP Simulator — PMBOK Guide 8th Edition

Unofficial **PMP exam-style practice** app updated for the **PMBOK® Guide – Eighth Edition** and the **July 2026 PMP Examination Content Outline (ECO)**. Domain quizzes with immediate feedback and a **timed exam** mode. Not affiliated with PMI; question quality and counts are for study only.

Built on [new-pmp-simulator](https://github.com/afathelbab/new-pmp-simulator); the original question bank is kept and mixed in.

**Live site:** [https://afathelbab.github.io/pmbok8-pmp-simulator](https://afathelbab.github.io/pmbok8-pmp-simulator)

## What's new in this version

- **505 new PMBOK 8 questions** (see [`content/pmbok8/`](content/pmbok8/README.md)):
  - 325 practice questions across the 6 principles, 7 performance domains (Governance, Scope, Schedule, Finance, Stakeholders, Resources, Risk) and the new topics (AI, sustainability, PMO, procurement appendix).
  - A **180-question full mock exam** built to the 2026 ECO blueprint: People 33% / Process 41% / Business Environment 26%, with ~40% predictive and ~60% agile/hybrid scenarios.
  - Every question is tagged with its ECO domain and task (e.g. `II.6 Plan and manage finance`) and delivery approach.
- **Three timed-exam sources**: all questions mixed (PMBOK 8 + classic bank), PMBOK 8 only with **ECO-weighted sampling**, or the full PMBOK 8 mock.
- **Exam timing updated** to the 2026 exam ratio: 180 questions / 240 minutes.
- **Results by ECO domain and by approach** (predictive / agile / hybrid), plus by performance domain.
- Practice screen grouped into *PMBOK 8*, *Mock exam* and *Classic bank*.
- GitHub Actions workflow runs tests, builds and deploys to GitHub Pages on every push to `main`.

## Features

- **Domain practice** — choose a category, optional shuffle, per-question explanations after you answer, session score and review of incorrect items.
- **Timed exam** — pick a source (mixed bank, PMBOK 8 ECO-weighted, or PMBOK 8 mock). Timer and optional “flag for review”. Explanations appear on the results screen.
- **Random scenario names** — optional replacement of common first names in stems, choices, and explanations with other names (session-random, consistent within a run). Toggle on the practice and exam setup screens; preference is stored in `localStorage` under `pmp_randomize_names` (default on). Edit the allowlist in `src/constants/personNames.js` as your bank grows.
- **GitHub Pages–friendly routing** — the app uses **hash URLs** (`#/`, `#/practice`, …) so refreshes work on static hosting.
- **English / Arabic** — first visit goes to `#/welcome` to pick a language (stored in `localStorage` as `pmp_app_language`). UI strings use i18n; the Arabic **question bank** is generated from English (see below).

## Arabic question bank (machine translation)

There is no hand-authored Arabic bank in the repo. To generate Arabic category JSON and `public/data/manifest-ar.json`:

1. Ensure `npm run split-data` has run (or run `npm run build`, which runs `split-data` first).
2. Run **`npm run translate-quiz-ar`** (requires network; uses `google-translate-api-x`).

This walks every question, choice, and explanation and can take a long time. Increase spacing between API calls if you hit rate limits: `TRANSLATE_DELAY_MS=300 npm run translate-quiz-ar`.

**Disclaimer:** Output is **machine-translated**. Verify critical wording for exam study; acronyms (e.g. “PM”) may be imperfect.

If `manifest-ar.json` or Arabic files are missing, the app falls back to the English manifest and categories when Arabic is selected. Fallback is **per category**.

**PMBOK 8 bank in Arabic:** all 505 PMBOK 8 questions (practice + mock exam) have a reviewed, terminology-consistent Arabic translation in `content/pmbok8-ar/` (glossary: `content/pmbok8-ar/GLOSSARY.md`). `npm run split-data` builds them into `public/data/ar/categories/p8-*.json` with **exactly the same answer positions** as English and merges them into `manifest-ar.json`. Do not run the machine-translation script on the `p8-` categories; edit `content/pmbok8-ar/` instead.

## Run locally

```bash
npm install
npm start
```

Open [http://localhost:3000](http://localhost:3000).

## Build & deploy

```bash
npm run build
```

Deploy the `build/` folder to any static host. Pushing to `main` deploys automatically through `.github/workflows/ci.yml` (set **Settings → Pages → Source** to *GitHub Actions*). Manual alternative:

```bash
npm run deploy
```

Requires `homepage` and `gh-pages` (see `package.json`).

## Question data workflow

Classic source JSON lives at `src/data/quiz-data.json`; the PMBOK 8 bank lives in `content/pmbok8/` (format documented in its README). Category files under `public/data/categories/` and `public/data/manifest.json` are **generated** so the browser loads questions on demand (smaller JS bundle).

Regenerate splits after editing the source file:

```bash
npm run split-data
```

`npm run build` runs `split-data` automatically (`prebuild`).

Duplicate question text within the same category is listed in **DUPLICATES.md** (generated by the split script).

## Informal pass threshold

Timed exam results compare your percentage to an **informal** practice threshold (`INFORMAL_PASS_PERCENT` in `src/constants/examConfig.js`). PMI does not publish a fixed passing score; treat this as motivation only.

## Scripts

| Script          | Description                                      |
|-----------------|--------------------------------------------------|
| `npm start`     | Dev server                                       |
| `npm run build` | Production build (runs `split-data` first)       |
| `npm test`      | Tests                                            |
| `npm run split-data` | Regenerate `public/data/*` from source JSON |
| `npm run translate-quiz-ar` | Generate Arabic `public/data/ar/**` + `manifest-ar.json` (network) |
| `npm run deploy`| Build + publish to `gh-pages` branch (manual alternative to the Actions workflow) |

## Tech stack

Create React App (React 19), React Router (hash router), client-side fetch for JSON under `public/data/`.

## License

Add a license file if you redistribute; this README does not imply any license on PMI materials.
