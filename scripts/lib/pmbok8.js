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

function loadCategory(cat, baseDir = CONTENT_DIR) {
  const dir = path.join(baseDir, cat.id);
  if (!fs.existsSync(dir)) return [];
  const files = fs
    .readdirSync(dir)
    .filter((f) => /^part\d+\.json$/.test(f))
    .sort((a, b) => Number(a.match(/\d+/)[0]) - Number(b.match(/\d+/)[0]));
  const out = [];
  for (const f of files) {
    const arr = JSON.parse(fs.readFileSync(path.join(dir, f), "utf8"));
    arr.forEach((item, i) => {
      if (baseDir === CONTENT_DIR) validate(item, `${cat.id}/${f}#${i + 1}`);
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

function toRaw(item, n, cat, correctPos, text) {
  // distractors keep a stem-seeded order (seeded by the ENGLISH stem so that
  // translations get identical option positions); the correct option goes to correctPos
  const t = text || item;
  const distractors = shuffledOrder(item.q)
    .filter((k) => k !== 0)
    .map((k) => t.o[k]);
  const choices = [...distractors];
  choices.splice(correctPos, 0, t.o[0]);
  return {
    "#": n,
    Question: t.q,
    "Choice 1": choices[0],
    "Choice 2": choices[1],
    "Choice 3": choices[2],
    "Choice 4": choices[3],
    "Right Answer": LETTERS[correctPos],
    Explanation: t.e,
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
function loadPmbok8(locale) {
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
    let texts = null;
    if (locale) {
      texts = loadCategory(cat, path.join(ROOT, "content", `pmbok8-${locale}`));
      if (texts.length !== items.length) {
        throw new Error(`${locale}/${cat.id}: ${texts.length} translated vs ${items.length} source items`);
      }
      texts.forEach((t, i) => {
        if (t.eco !== items[i].eco || t.task !== items[i].task || t.ap !== items[i].ap) {
          throw new Error(`${locale}/${cat.id} item ${i + 1}: metadata differs from source`);
        }
      });
    }
    return {
      ...cat,
      items: items.map((it, i) => toRaw(it, i + 1, cat, key[i], texts && texts[i])),
    };
  });
}

/** Hand-written Arabic category labels. */
const LABELS_AR = {
  "p8-principles": "PMBOK 8 · المبادئ والقيمة والتكييف",
  "p8-governance": "PMBOK 8 · الحوكمة",
  "p8-scope": "PMBOK 8 · النطاق",
  "p8-schedule": "PMBOK 8 · الجدول الزمني",
  "p8-finance": "PMBOK 8 · المالية",
  "p8-stakeholders": "PMBOK 8 · أصحاب المصلحة",
  "p8-resources": "PMBOK 8 · الموارد",
  "p8-risk": "PMBOK 8 · المخاطر",
  "p8-emerging": "PMBOK 8 · الذكاء الاصطناعي والاستدامة ومكتب المشاريع والمشتريات",
  "p8-mock-exam": "PMBOK 8 · امتحان تجريبي كامل (مخطط 2026)",
};

module.exports = { loadPmbok8, LABELS_AR, ECO_DOMAINS, APPROACHES };
