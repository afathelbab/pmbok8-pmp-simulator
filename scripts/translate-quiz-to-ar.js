/**
 * Machine-translates English category JSON to Arabic (google-translate-api-x).
 * Outputs public/data/ar/categories/*.json and public/data/manifest-ar.json
 *
 * Quality: automated translation — review critical items for exam prep.
 * Run: npm run translate-quiz-ar
 *
 * Options (env):
 *   TRANSLATE_ONLY=p8-      only translate categories whose id starts with this prefix
 *   TRANSLATE_SKIP_EXISTING=1  keep already-translated category files
 * Existing entries in manifest-ar.json are preserved and merged, and the
 * output manifest follows the English manifest order and metadata (group, etc.).
 */
const fs = require("fs");
const path = require("path");
const translate = require("google-translate-api-x");

const ROOT = path.join(__dirname, "..");
const MANIFEST_PATH = path.join(ROOT, "public", "data", "manifest.json");
const OUT_DIR = path.join(ROOT, "public", "data", "ar", "categories");
const OUT_MANIFEST = path.join(ROOT, "public", "data", "manifest-ar.json");

const DELAY_MS = Number(process.env.TRANSLATE_DELAY_MS || 120);

const FIELDS = ["Question", "Choice 1", "Choice 2", "Choice 3", "Choice 4", "Explanation"];
const ONLY = process.env.TRANSLATE_ONLY || "";
const SKIP_EXISTING = process.env.TRANSLATE_SKIP_EXISTING === "1";

/** Hand-written Arabic labels (better than machine translation for short titles). */
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

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function tr(text, retries = 3) {
  if (text == null) return text;
  const s = String(text);
  if (!s.trim()) return text;
  let lastErr;
  for (let attempt = 0; attempt < retries; attempt += 1) {
    try {
      const res = await translate(s, { to: "ar", from: "en" });
      return res.text;
    } catch (e) {
      lastErr = e;
      await sleep(500 * (attempt + 1));
    }
  }
  throw lastErr;
}

async function translateRow(row, stats) {
  const out = { ...row };
  for (const f of FIELDS) {
    if (out[f] != null && String(out[f]).trim()) {
      await sleep(DELAY_MS);
      out[f] = await tr(String(out[f]));
      stats.calls += 1;
    }
  }
  return out;
}

async function main() {
  if (!fs.existsSync(MANIFEST_PATH)) {
    console.error("Run npm run split-data first (manifest missing).");
    process.exit(1);
  }

  fs.mkdirSync(OUT_DIR, { recursive: true });

  const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, "utf8"));
  const stats = { calls: 0 };
  const previous = fs.existsSync(OUT_MANIFEST)
    ? JSON.parse(fs.readFileSync(OUT_MANIFEST, "utf8"))
    : { categories: [] };
  const prevById = Object.fromEntries(previous.categories.map((c) => [c.id, c]));
  const arCategories = [];

  for (const cat of manifest.categories) {
    const rel = cat.file.replace(/^\//, "");
    const enPath = path.join(ROOT, "public", rel);
    const fname = path.basename(rel);
    const outPath = path.join(OUT_DIR, fname);
    const selected = !ONLY || cat.id.startsWith(ONLY);
    const prev = prevById[cat.id];
    if (!selected || (SKIP_EXISTING && prev && fs.existsSync(outPath))) {
      if (prev) arCategories.push({ ...cat, label: prev.label, file: prev.file });
      continue;
    }
    console.log("Translating", cat.id, fname);

    const rows = JSON.parse(fs.readFileSync(enPath, "utf8"));
    const translated = [];
    let idx = 0;
    for (const row of rows) {
      translated.push(await translateRow(row, stats));
      idx += 1;
      if (idx % 25 === 0) {
        console.log("  …", idx, "/", rows.length);
      }
    }

    fs.writeFileSync(
      path.join(OUT_DIR, fname),
      JSON.stringify(translated)
    );

    let labelAr = LABELS_AR[cat.id];
    if (!labelAr) {
      await sleep(DELAY_MS);
      labelAr = await tr(cat.label);
      stats.calls += 1;
    }

    arCategories.push({
      ...cat,
      label: labelAr,
      file: `/data/ar/categories/${fname}`,
    });
  }

  const outManifest = {
    ...manifest,
    locale: "ar",
    categories: arCategories,
    translatedNote:
      "Machine-translated from English; verify wording for high-stakes study.",
  };

  fs.writeFileSync(OUT_MANIFEST, JSON.stringify(outManifest, null, 2));
  console.log(
    "Done. Approx translate calls:",
    stats.calls,
    "Wrote",
    OUT_MANIFEST
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
