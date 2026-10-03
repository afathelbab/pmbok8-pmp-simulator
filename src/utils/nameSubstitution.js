import {
  REPLACEMENT_GIVEN_NAMES,
  SOURCE_PERSON_NAMES,
} from "../constants/personNames";

function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Deterministic PRNG for repeatable tests (mulberry32). */
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function rand() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * @param {string} tpl replacement word (Title Case in pool)
 * @param {string} original matched substring from source text
 */
export function applyCaseLikeSample(tpl, original) {
  if (!original) return tpl;
  if (original.length >= 2 && original === original.toUpperCase()) {
    return tpl.toUpperCase();
  }
  const rest = original.slice(1);
  if (
    original[0] === original[0].toUpperCase() &&
    rest === rest.toLowerCase()
  ) {
    return tpl.charAt(0).toUpperCase() + tpl.slice(1).toLowerCase();
  }
  if (original === original.toLowerCase()) {
    return tpl.toLowerCase();
  }
  return tpl;
}

function pickReplacement(rng, avoidLower) {
  const pool = REPLACEMENT_GIVEN_NAMES;
  for (let attempt = 0; attempt < 120; attempt++) {
    const pick = pool[Math.floor(rng() * pool.length)];
    if (pick.toLowerCase() !== avoidLower) return pick;
  }
  return pool[0];
}

/**
 * @param {number} seed
 * @param {boolean} enabled
 */
export function createNameMapper(seed, enabled) {
  if (!enabled) {
    return {
      mapText: (t) => t,
      mapQuestion: (q) => q,
    };
  }

  const rng = mulberry32(seed);
  /** @type {Map<string, string>} tokenLower -> Title Case replacement */
  const chosen = new Map();

  function replacementForMatch(match) {
    const key = match.toLowerCase();
    if (!chosen.has(key)) {
      chosen.set(key, pickReplacement(rng, key));
    }
    const tpl = chosen.get(key);
    return applyCaseLikeSample(tpl, match);
  }

  /** Precomputed regexes — longest source names first (module constant order). */
  const regexes = SOURCE_PERSON_NAMES.map((name) => ({
    re: new RegExp(`\\b${escapeRegExp(name)}\\b`, "gi"),
  }));

  function mapText(text) {
    if (text == null || typeof text !== "string") return text;
    let out = text;
    for (const { re } of regexes) {
      out = out.replace(re, (m) => replacementForMatch(m));
    }
    return out;
  }

  function mapQuestion(q) {
    return {
      ...q,
      question: mapText(q.question),
      choices: {
        A: mapText(q.choices.A),
        B: mapText(q.choices.B),
        C: mapText(q.choices.C),
        D: mapText(q.choices.D),
      },
      explanation: mapText(q.explanation),
    };
  }

  return { mapText, mapQuestion };
}

/** localStorage key — default ON when unset */
export const RANDOMIZE_NAMES_STORAGE_KEY = "pmp_randomize_names";

export function readRandomizeNamesPreference() {
  try {
    return localStorage.getItem(RANDOMIZE_NAMES_STORAGE_KEY) !== "false";
  } catch {
    return true;
  }
}

export function writeRandomizeNamesPreference(value) {
  try {
    localStorage.setItem(RANDOMIZE_NAMES_STORAGE_KEY, value ? "true" : "false");
  } catch {
    /* ignore */
  }
}
