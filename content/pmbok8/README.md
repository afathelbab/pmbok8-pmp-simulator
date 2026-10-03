# PMBOK Guide 8th Edition question bank

Original, exam-style questions written for this simulator and aligned to:

- **PMBOK® Guide – Eighth Edition** (PMI, Nov 2025): 6 principles, 7 performance domains (Governance, Scope, Schedule, Finance, Stakeholders, Resources, Risk), 5 focus areas, 40 processes, tailoring, and the PMO / AI / procurement appendices.
- **PMP Examination Content Outline (July 2026)**: People 33%, Process 41%, Business Environment 26%; ~40% predictive, ~60% agile/hybrid; 180 questions in 240 minutes.

No text is copied from PMI publications. Process and principle names follow the published structure of the Eighth Edition; verify wording against your own copy of the guide.

## Layout

```
content/pmbok8/
  categories.json          # category ids, labels, PMBOK domain, mock flag
  <category-id>/part1.json # arrays of questions (any number of partN.json files)
```

| Category | Questions |
|---|---|
| Principles, Value & Tailoring | 35 |
| Governance | 40 |
| Scope | 35 |
| Schedule | 35 |
| Finance | 35 |
| Stakeholders | 40 |
| Resources | 40 |
| Risk | 35 |
| AI, Sustainability, PMO & Procurement | 30 |
| **Full Mock Exam (2026 ECO)** | **180** (People 58 / Process 75 / Business Env 47; Predictive 72 / Agile 54 / Hybrid 54) |

## Question format

```json
{
  "q": "Stem",
  "o": ["CORRECT option", "distractor", "distractor", "distractor"],
  "e": "Explanation (do not refer to option letters)",
  "eco": "People | Process | Business Environment",
  "task": "I.1–I.8 | II.1–II.10 | III.1–III.8",
  "ap": "Predictive | Agile | Hybrid",
  "dom": "(mock exam only) PMBOK 8 performance domain"
}
```

Always put the **correct option first**. `scripts/lib/pmbok8.js` validates every item (four unique options, valid ECO task code, no letter references in explanations, no duplicate stems across the bank) and places the correct answers so that A/B/C/D are evenly balanced within each category. The order is deterministic, so rebuilding does not reshuffle answers.

Run `npm run split-data` (or `npm run build`) to regenerate `public/data/`. `npm test` also checks bank integrity and the mock-exam blueprint.

### 2026 ECO task codes

- **People (I)**: 1 common vision · 2 conflicts · 3 lead the team · 4 engage stakeholders · 5 align expectations · 6 manage expectations · 7 knowledge transfer · 8 communication
- **Process (II)**: 1 integrated plan & delivery · 2 scope · 3 value-based delivery · 4 resources · 5 procurement · 6 finance · 7 quality · 8 schedule · 9 evaluate status · 10 closure
- **Business Environment (III)**: 1 governance · 2 compliance · 3 changes · 4 impediments & issues · 5 risk · 6 continuous improvement · 7 organizational change · 8 external environment

## Arabic translation

`content/pmbok8-ar/<category>/partN.json` mirrors every English file item-for-item (same order, options in the same order with the correct one first; `eco`/`task`/`ap`/`dom` unchanged in English). The build checks counts and metadata, and uses the English stem to place options, so Arabic and English share identical answer keys. When you edit or add an English question, make the same change in the Arabic file. Terminology: `content/pmbok8-ar/GLOSSARY.md`.
