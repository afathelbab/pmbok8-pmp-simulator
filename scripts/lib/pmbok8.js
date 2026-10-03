/**
 * Loads and validates the PMBOK Guide 8th Edition question bank from
 * content/pmbok8/<category>/part*.json and converts it to the app's raw item
 * format ("Question", "Choice 1".."Choice 4", "Right Answer", "Explanation").
 *
 * Authoring format (one object per question):
 *   q    – stem
 *   o    – [correct, distractor, distractor, distractor]  (correct FIRST)
 *   e    – explanation (must not refer to option letters)
 *   eco  – "People" | "Process" | "Business Environment"  (2026 ECO domain)
 *   task – ECO task code, e.g. "I.3", "II.6", "III.5"
 *   ap   – "Predictive" | "Agile" | "Hybrid"
 *   dom  – (mock exam only, optional) PMBOK 8 performance domain
 *
 * Option order is shuffled deterministically so the correct answer is spread
 * evenly across A–D within each category and stays stable between builds.
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..", "..");
const CONTENT_DIR = path.join(ROOT, "content", "pmbok8");

const ECO_DOMAINS = {
  People: { code: "I", tasks: 8 },
  Process: { code: "II", tasks: 10 },
  "Business Environment": { code: "III", tasks: 8 },
};
const APPROACHES = ["Predictive", "Agile", "Hybrid"];
const LETTERS = ["A", "B", "C", "D"];

/** FNV-1a 32-bit hash */
function hash(str) {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** mulberry32 PRNG */
function rng(seed) {
  let a = seed;
  return function next() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffledOrder(seedText) {
  const r = rng(hash(seedText));
  const idx = [0, 1, 2, 3];
  for (let i = idx.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [idx[i], idx[j]] = [idx[j], idx[i]];
  }
  return idx;
}

function validate(item, where) {
  const errs = [];
  if (!item.q || typeof item.q !== "string") errs.push("missing q");
  if (!Array.isArray(item.o) || item.o.length !== 4) errs.push("o must have 4 options");
  else {
    if (item.o.some((x) => !x || typeof x !== "string")) errs.push("empty option");
    if (new Set(item.o.map((x) => x.trim().toLowerCase())).size !== 4) errs.push("duplicate options");
  }
  if (!item.e || typeof item.e !== "string") errs.push("missing e");
  else if (/\b(option|choice|answer)\s+[A-D]\b/i.test(item.e)) errs.push("explanation refers to a letter");
  const eco = ECO_DOMAINS[item.eco];
  if (!eco) errs.push(`bad eco "${item.eco}"`);
  else {
    const m = String(item.task || "").match(/^(I|II|III)\.(\d+)$/);
    if (!m || m[1] !== eco.code || Number(m[2]) < 1 || Number(m[2]) > eco.tasks) {
      errs.push(`bad task "${item.task}" for ${item.eco}`);
    }
  }
  if (!APPROACHES.includes(item.ap)) errs.push(`bad ap "${item.ap}"`);
  if (errs.length) throw new Error(`${where}: ${errs.join("; ")}\n  -> ${String(item.q).slice(0, 90)}`);
}

function loadCategory(cat) {
  const dir = path.join(CONTENT_DIR, cat.id);
  if (!fs.existsSync(dir)) return [];
  const files = fs
    .readdirSync(dir)
    .filter((f) => /^part\d+\.json$/.test(f))
    .sort((a, b) => Number(a.match(/\d+/)[0]) - Number(b.match(/\d+/)[0]));
  const out = [];
  for (const f of files) {
    const arr = JSON.parse(fs.readFileSync(path.join(dir, f), "utf8"));
    arr.forEach((item, i) => {
      validate(item, `${cat.id}/${f}#${i + 1}`);
      out.push(item);
    });
  }
  return out;
}

/**
 * Balanced answer key for a category: an equal share of A/B/C/D, shuffled with a
 * seed derived from the category id so it is stable between builds.
 */
function balancedKey(catId, n) {
  const key = [];
  for (let i = 0; i < n; i++) key.push(i % 4);
  const r = rng(hash(`key:${catId}`));
  for (let i = key.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [key[i], key[j]] = [key[j], key[i]];
  }
  return key;
}

function toRaw(item, n, cat, correctPos) {
  // distractors keep a stem-seeded order; the correct option goes to correctPos
  const distractors = shuffledOrder(item.q)
    .filter((k) => k !== 0)
    .map((k) => item.o[k]);
  const choices = [...distractors];
  choices.splice(correctPos, 0, item.o[0]);
  return {
    "#": n,
    Question: item.q,
    "Choice 1": choices[0],
    "Choice 2": choices[1],
    "Choice 3": choices[2],
    "Choice 4": choices[3],
    "Right Answer": LETTERS[correctPos],
    Explanation: item.e,
    Edition: "PMBOK 8",
    "PMBOK Domain": item.dom || cat.domain || "",
    "ECO Domain": item.eco,
    "ECO Task": item.task,
    Approach: item.ap,
  };
}

/**
 * @returns {Array<{ id: string, label: string, domain: string|null, mock?: boolean, items: object[] }>}
 */
function loadPmbok8() {
  const meta = JSON.parse(fs.readFileSync(path.join(CONTENT_DIR, "categories.json"), "utf8"));
  const seenStems = new Map();
  return meta.categories.map((cat) => {
    const items = loadCategory(cat);
    for (const it of items) {
      const key = it.q.trim().toLowerCase();
      if (seenStems.has(key)) {
        throw new Error(`Duplicate stem in ${cat.id} (also in ${seenStems.get(key)}): ${it.q.slice(0, 90)}`);
      }
      seenStems.set(key, cat.id);
    }
    const key = balancedKey(cat.id, items.length);
    return { ...cat, items: items.map((it, i) => toRaw(it, i + 1, cat, key[i])) };
  });
}

module.exports = { loadPmbok8, ECO_DOMAINS, APPROACHES };
