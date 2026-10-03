/**
 * Reads src/data/quiz-data.json (classic bank) and content/pmbok8/** (PMBOK 8th
 * Edition bank, see scripts/lib/pmbok8.js) and writes:
 * - public/data/categories/<slug>.json per category (raw arrays)
 * - public/data/manifest.json (category metadata + paths)
 * - DUPLICATES.md (duplicate Question text within same category)
 *
 * Run: node scripts/split-quiz-data.js
 */
const fs = require("fs");
const path = require("path");
const { loadPmbok8 } = require("./lib/pmbok8");

const ROOT = path.join(__dirname, "..");
const INPUT = path.join(ROOT, "src", "data", "quiz-data.json");
const OUT_DIR = path.join(ROOT, "public", "data", "categories");
const MANIFEST_PATH = path.join(ROOT, "public", "data", "manifest.json");
const DUPLICATES_PATH = path.join(ROOT, "DUPLICATES.md");

function slugify(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function main() {
  if (!fs.existsSync(INPUT)) {
    console.error("Missing input:", INPUT);
    process.exit(1);
  }

  const raw = fs.readFileSync(INPUT, "utf8");
  const data = JSON.parse(raw);

  fs.mkdirSync(OUT_DIR, { recursive: true });

  const manifest = {
    version: 2,
    generated: new Date().toISOString(),
    categories: [],
  };

  const duplicateLines = [];

  for (const [categoryName, items] of Object.entries(data)) {
    if (!Array.isArray(items)) {
      console.warn("Skipping non-array category:", categoryName);
      continue;
    }

    const id = slugify(categoryName);
    const filename = `${id}.json`;
    const filePath = path.join(OUT_DIR, filename);
    fs.writeFileSync(filePath, JSON.stringify(items));

    const seen = new Set();
    for (const item of items) {
      const q = item["Question"] ?? "";
      if (seen.has(q)) {
        duplicateLines.push(
          `- **${categoryName}**: ${q.replace(/\s+/g, " ").slice(0, 120)}${q.length > 120 ? "…" : ""}`
        );
      }
      seen.add(q);
    }

    manifest.categories.push({
      id,
      label: categoryName,
      file: `/data/categories/${filename}`,
      questionCount: items.length,
      group: "classic",
      edition: "PMBOK 6/7",
    });
  }

  manifest.categories.sort((a, b) => a.label.localeCompare(b.label));

  // PMBOK Guide 8th Edition bank (kept in authored order, listed first)
  const p8 = loadPmbok8().filter((c) => c.items.length);
  const p8Entries = p8.map((cat) => {
    const filename = `${cat.id}.json`;
    fs.writeFileSync(path.join(OUT_DIR, filename), JSON.stringify(cat.items));
    const eco = {};
    for (const it of cat.items) eco[it["ECO Domain"]] = (eco[it["ECO Domain"]] || 0) + 1;
    return {
      id: cat.id,
      label: cat.label,
      file: `/data/categories/${filename}`,
      questionCount: cat.items.length,
      group: cat.mock ? "pmbok8-mock" : "pmbok8",
      edition: "PMBOK 8",
      ecoCounts: eco,
    };
  });
  manifest.categories = [...p8Entries, ...manifest.categories];

  fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2));

  const dupHeader =
    "# Duplicate question prompts\n\nWithin the same category, the following `Question` values appear more than once (second and later occurrences). Review for manual cleanup.\n\n";
  fs.writeFileSync(
    DUPLICATES_PATH,
    dupHeader + (duplicateLines.length ? duplicateLines.join("\n") : "_No duplicates detected._")
  );

  console.log(
    "Wrote",
    manifest.categories.length,
    "category files to public/data/categories and manifest.json",
    `(PMBOK 8: ${p8Entries.length} categories, ${p8Entries.reduce((n, c) => n + c.questionCount, 0)} questions)`
  );
  if (duplicateLines.length) {
    console.warn("Duplicate prompts:", duplicateLines.length, "(see DUPLICATES.md)");
  }
}

main();
