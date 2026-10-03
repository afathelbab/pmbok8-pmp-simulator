import { assetUrl } from "../utils/assetUrl";
import { getQuizLocale } from "../utils/quizLocale";

/** @typedef {{ id: string, label: string, file: string, questionCount: number, group?: string, edition?: string, ecoCounts?: Record<string, number> }} ManifestCategory */
/** @typedef {{ version: number, generated: string, categories: ManifestCategory[] }} QuizManifest */

async function getJson(path) {
  const res = await fetch(assetUrl(path));
  if (!res.ok) {
    const err = new Error(`Failed to load ${path} (${res.status})`);
    err.status = res.status;
    throw err;
  }
  return res.json();
}

/**
 * Merge a localized manifest onto the English one: the English manifest defines
 * the category list, order and metadata; localized label/file are used where a
 * translation exists, otherwise the English category is kept as a fallback.
 * @param {QuizManifest} en
 * @param {QuizManifest | null} loc
 * @returns {QuizManifest}
 */
export function mergeLocalizedManifest(en, loc) {
  if (!loc) return en;
  const byId = Object.fromEntries((loc.categories || []).map((c) => [c.id, c]));
  return {
    ...en,
    categories: en.categories.map((c) =>
      byId[c.id] ? { ...c, label: byId[c.id].label, file: byId[c.id].file } : c
    ),
  };
}

/** @returns {Promise<QuizManifest>} */
export async function fetchManifest() {
  const en = await getJson("/data/manifest.json");
  if (getQuizLocale() !== "ar") return en;
  let ar = null;
  try {
    ar = await getJson("/data/manifest-ar.json");
  } catch (e) {
    ar = null;
  }
  return mergeLocalizedManifest(en, ar);
}

/** @param {string} filePath e.g. `/data/categories/framework.json` */
export async function fetchCategoryRaw(filePath) {
  return getJson(filePath);
}
