/**
 * Integrity checks for the PMBOK 8th Edition question bank (content/pmbok8).
 */
const { loadPmbok8 } = require("../../scripts/lib/pmbok8");
const { mergeLocalizedManifest } = require("../api/quizDataApi");

const cats = loadPmbok8();
const all = cats.flatMap((c) => c.items);

test("bank loads and every question is valid", () => {
  expect(all.length).toBeGreaterThanOrEqual(480);
  for (const q of all) {
    expect(["A", "B", "C", "D"]).toContain(q["Right Answer"]);
    expect(q.Explanation.length).toBeGreaterThan(20);
  }
});

test("answer key is balanced within each category", () => {
  for (const c of cats) {
    const counts = { A: 0, B: 0, C: 0, D: 0 };
    c.items.forEach((q) => (counts[q["Right Answer"]] += 1));
    const vals = Object.values(counts);
    expect(Math.max(...vals) - Math.min(...vals)).toBeLessThanOrEqual(1);
  }
});

test("mock exam matches the 2026 ECO blueprint", () => {
  const mock = cats.find((c) => c.mock).items;
  expect(mock).toHaveLength(180);
  const n = (k, v) => mock.filter((q) => q[k] === v).length;
  // People 33% / Process 41% / Business Environment 26% (±2 questions)
  expect(Math.abs(n("ECO Domain", "People") - 59)).toBeLessThanOrEqual(2);
  expect(Math.abs(n("ECO Domain", "Process") - 74)).toBeLessThanOrEqual(2);
  expect(Math.abs(n("ECO Domain", "Business Environment") - 47)).toBeLessThanOrEqual(2);
  // ~40% predictive, ~60% agile/hybrid
  expect(n("Approach", "Predictive")).toBe(72);
  expect(n("Approach", "Agile") + n("Approach", "Hybrid")).toBe(108);
});

test("localized manifest falls back to English for untranslated categories", () => {
  const en = {
    version: 2,
    categories: [
      { id: "p8-risk", label: "PMBOK 8 · Risk", file: "/en/p8-risk.json", group: "pmbok8" },
      { id: "risk", label: "Risk", file: "/en/risk.json", group: "classic" },
    ],
  };
  const ar = { categories: [{ id: "risk", label: "المخاطر", file: "/ar/risk.json" }] };
  const merged = mergeLocalizedManifest(en, ar);
  expect(merged.categories[0]).toEqual(en.categories[0]);
  expect(merged.categories[1]).toMatchObject({ label: "المخاطر", file: "/ar/risk.json", group: "classic" });
});
