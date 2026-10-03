import {
  ECO_WEIGHTS,
  PMP_REFERENCE_MINUTES,
  PMP_REFERENCE_QUESTION_COUNT,
} from "../constants/examConfig";

/** @typedef {{ question: string, choices: Record<string, string>, correctAnswer: string, explanation: string, domainId?: string, domainLabel?: string, eco?: string, ecoTask?: string, approach?: string, pmbokDomain?: string }} QuizQuestion */

/**
 * @param {Record<string, unknown>} item
 * @returns {Omit<QuizQuestion, 'domainId'|'domainLabel'>}
 */
export function transformRawItem(item) {
  return {
    question: item["Question"],
    choices: {
      A: item["Choice 1"],
      B: item["Choice 2"],
      C: item["Choice 3"],
      D: item["Choice 4"],
    },
    correctAnswer: (() => {
      const raw = String(item["Right Answer"] ?? "").trim().toUpperCase();
      const m = raw.match(/[ABCD]/);
      return m ? m[0] : "A";
    })(),
    explanation: item["Explanation"] || "No explanation provided.",
    ...(item["ECO Domain"] ? { eco: item["ECO Domain"] } : {}),
    ...(item["ECO Task"] ? { ecoTask: item["ECO Task"] } : {}),
    ...(item["Approach"] ? { approach: item["Approach"] } : {}),
    ...(item["PMBOK Domain"] ? { pmbokDomain: item["PMBOK Domain"] } : {}),
  };
}

/**
 * @param {Record<string, unknown>[]} data
 * @param {{ domainId?: string, domainLabel?: string }} [meta]
 * @returns {QuizQuestion[]}
 */
export function transformData(data, meta = {}) {
  return data.map((item) => ({
    ...transformRawItem(item),
    ...(meta.domainId ? { domainId: meta.domainId } : {}),
    ...(meta.domainLabel ? { domainLabel: meta.domainLabel } : {}),
  }));
}

/** Fisher–Yates shuffle (mutates copy). */
export function shuffleArray(items) {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * @param {QuizQuestion[]} pool
 * @param {number} n
 */
export function sampleQuestions(pool, n) {
  const shuffled = shuffleArray(pool);
  return shuffled.slice(0, Math.min(n, shuffled.length));
}

/**
 * Split n into integer counts proportional to weights (largest remainder).
 * @param {number} n
 * @param {Record<string, number>} weights
 * @returns {Record<string, number>}
 */
export function allocateByWeights(n, weights) {
  const keys = Object.keys(weights);
  const total = keys.reduce((s, k) => s + weights[k], 0) || 1;
  const raw = keys.map((k) => ({ k, v: (n * weights[k]) / total }));
  const out = {};
  let used = 0;
  for (const r of raw) {
    out[r.k] = Math.floor(r.v);
    used += out[r.k];
  }
  raw
    .slice()
    .sort((a, b) => b.v - Math.floor(b.v) - (a.v - Math.floor(a.v)))
    .slice(0, n - used)
    .forEach((r) => {
      out[r.k] += 1;
    });
  return out;
}

/**
 * Sample n questions following the 2026 PMP ECO weighting
 * (People 33% / Process 41% / Business Environment 26%).
 * Only questions tagged with an ECO domain are used. If one domain runs short,
 * the remainder is filled from the other tagged questions.
 * @param {QuizQuestion[]} pool
 * @param {number} n
 * @param {Record<string, number>} [weights]
 */
export function sampleEcoWeighted(pool, n, weights = ECO_WEIGHTS) {
  const tagged = pool.filter((q) => q.eco && weights[q.eco] != null);
  const want = Math.min(n, tagged.length);
  const targets = allocateByWeights(want, weights);
  const picked = [];
  const rest = [];
  for (const key of Object.keys(weights)) {
    const bucket = shuffleArray(tagged.filter((q) => q.eco === key));
    picked.push(...bucket.slice(0, targets[key]));
    rest.push(...bucket.slice(targets[key]));
  }
  if (picked.length < want) {
    picked.push(...shuffleArray(rest).slice(0, want - picked.length));
  }
  return shuffleArray(picked);
}

/**
 * Scaled minutes from reference exam length (minimum 1).
 * @param {number} questionCount
 */
export function examMinutesForQuestionCount(questionCount) {
  if (!questionCount || questionCount < 1) return 1;
  return Math.max(
    1,
    Math.round(
      (PMP_REFERENCE_MINUTES * questionCount) / PMP_REFERENCE_QUESTION_COUNT
    )
  );
}

/**
 * @param {QuizQuestion[]} questions
 * @param {Record<number, string | undefined | null>} answersByIndex
 */
export function scoreAnswers(questions, answersByIndex) {
  let correct = 0;
  for (let i = 0; i < questions.length; i++) {
    const a = answersByIndex[i];
    if (a && String(a).toUpperCase() === questions[i].correctAnswer) {
      correct += 1;
    }
  }
  const total = questions.length;
  const percent = total ? Math.round((100 * correct) / total) : 0;
  return { correct, total, percent };
}

/**
 * @param {QuizQuestion[]} questions
 * @param {Record<number, string | undefined | null>} answersByIndex
 * @param {(q: QuizQuestion) => string | undefined} [keyFn] grouping key (default: category label)
 * @returns {Record<string, { correct: number, total: number }>}
 */
export function domainBreakdown(questions, answersByIndex, keyFn) {
  /** @type {Record<string, { correct: number, total: number }>} */
  const out = {};
  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    const label = (keyFn ? keyFn(q) : q.domainLabel) || "Unknown";
    if (!out[label]) out[label] = { correct: 0, total: 0 };
    out[label].total += 1;
    const a = answersByIndex[i];
    if (a && String(a).toUpperCase() === q.correctAnswer) {
      out[label].correct += 1;
    }
  }
  return out;
}

export const CHOICE_KEYS = ["A", "B", "C", "D"];

/** Map keyboard code to A–D (1–4 and a–d). */
export function keyToChoiceKey(key) {
  const k = key.length === 1 ? key.toUpperCase() : key;
  if (k >= "1" && k <= "4") {
    return CHOICE_KEYS[Number(k) - 1];
  }
  if (CHOICE_KEYS.includes(k)) return k;
  return null;
}
