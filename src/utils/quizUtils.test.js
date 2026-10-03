import {
  allocateByWeights,
  domainBreakdown,
  sampleEcoWeighted,
  examMinutesForQuestionCount,
  keyToChoiceKey,
  sampleQuestions,
  scoreAnswers,
  transformRawItem,
} from "./quizUtils";
import {
  ECO_WEIGHTS,
  PMP_REFERENCE_MINUTES,
  PMP_REFERENCE_QUESTION_COUNT,
} from "../constants/examConfig";

describe("transformRawItem", () => {
  it("extracts A–D from Right Answer", () => {
    const q = transformRawItem({
      Question: "Q1",
      "Choice 1": "A) a",
      "Choice 2": "B) b",
      "Choice 3": "C) c",
      "Choice 4": "D) d",
      "Right Answer": "b",
      Explanation: "exp",
    });
    expect(q.correctAnswer).toBe("B");
  });
});

describe("examMinutesForQuestionCount", () => {
  it("scales from reference length", () => {
    expect(examMinutesForQuestionCount(PMP_REFERENCE_QUESTION_COUNT)).toBe(
      PMP_REFERENCE_MINUTES
    );
    expect(examMinutesForQuestionCount(60)).toBe(
      Math.max(1, Math.round((PMP_REFERENCE_MINUTES * 60) / PMP_REFERENCE_QUESTION_COUNT))
    );
  });
});

describe("sampleQuestions", () => {
  it("returns at most n items", () => {
    const pool = Array.from({ length: 20 }, (_, i) => ({
      question: `q${i}`,
      choices: { A: "a", B: "b", C: "c", D: "d" },
      correctAnswer: "A",
      explanation: "e",
    }));
    const s = sampleQuestions(pool, 5);
    expect(s).toHaveLength(5);
  });
});

describe("scoreAnswers", () => {
  it("counts matches", () => {
    const questions = [
      { correctAnswer: "A" },
      { correctAnswer: "B" },
    ];
    const r = scoreAnswers(questions, { 0: "A", 1: "C" });
    expect(r.correct).toBe(1);
    expect(r.total).toBe(2);
    expect(r.percent).toBe(50);
  });
});

describe("domainBreakdown", () => {
  it("groups by domainLabel", () => {
    const questions = [
      { correctAnswer: "A", domainLabel: "X" },
      { correctAnswer: "B", domainLabel: "X" },
    ];
    const b = domainBreakdown(questions, { 0: "A", 1: "B" });
    expect(b.X).toEqual({ correct: 2, total: 2 });
  });
});

describe("keyToChoiceKey", () => {
  it("maps keys 1–4 and a–d", () => {
    expect(keyToChoiceKey("1")).toBe("A");
    expect(keyToChoiceKey("d")).toBe("D");
  });
});

describe("PMBOK 8 metadata", () => {
  it("carries ECO, approach and PMBOK domain tags", () => {
    const q = transformRawItem({
      Question: "Q",
      "Choice 1": "a",
      "Choice 2": "b",
      "Choice 3": "c",
      "Choice 4": "d",
      "Right Answer": "C",
      Explanation: "e",
      "ECO Domain": "Process",
      "ECO Task": "II.6",
      Approach: "Agile",
      "PMBOK Domain": "Finance",
    });
    expect(q).toMatchObject({
      correctAnswer: "C",
      eco: "Process",
      ecoTask: "II.6",
      approach: "Agile",
      pmbokDomain: "Finance",
    });
  });
});

describe("allocateByWeights", () => {
  it("splits 180 per the 2026 ECO", () => {
    const out = allocateByWeights(180, ECO_WEIGHTS);
    expect(out.People + out.Process + out["Business Environment"]).toBe(180);
    expect(out).toEqual({ People: 59, Process: 74, "Business Environment": 47 });
  });
  it("always sums to n", () => {
    for (const n of [1, 7, 60, 90, 133]) {
      const out = allocateByWeights(n, ECO_WEIGHTS);
      expect(Object.values(out).reduce((a, b) => a + b, 0)).toBe(n);
    }
  });
});

describe("sampleEcoWeighted", () => {
  const make = (eco, n) =>
    Array.from({ length: n }, (_, i) => ({ question: `${eco}-${i}`, eco }));
  const pool = [
    ...make("People", 100),
    ...make("Process", 100),
    ...make("Business Environment", 100),
    { question: "classic" },
  ];

  it("follows the weights and ignores untagged questions", () => {
    const picked = sampleEcoWeighted(pool, 100);
    expect(picked).toHaveLength(100);
    const count = (k) => picked.filter((q) => q.eco === k).length;
    expect(count("People")).toBe(33);
    expect(count("Process")).toBe(41);
    expect(count("Business Environment")).toBe(26);
    expect(picked.some((q) => !q.eco)).toBe(false);
  });

  it("fills from other domains when one runs short", () => {
    const short = [...make("People", 5), ...make("Process", 100), ...make("Business Environment", 100)];
    const picked = sampleEcoWeighted(short, 60);
    expect(picked).toHaveLength(60);
    expect(new Set(picked.map((q) => q.question)).size).toBe(60);
  });
});

describe("domainBreakdown with key function", () => {
  it("groups by ECO domain", () => {
    const qs = [
      { eco: "People", correctAnswer: "A" },
      { eco: "People", correctAnswer: "B" },
      { eco: "Process", correctAnswer: "C" },
    ];
    const out = domainBreakdown(qs, { 0: "A", 1: "A", 2: "C" }, (q) => q.eco);
    expect(out).toEqual({
      People: { correct: 1, total: 2 },
      Process: { correct: 1, total: 1 },
    });
  });
});
