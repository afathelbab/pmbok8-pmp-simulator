/** Informal practice threshold only — PMI does not publish a fixed exam pass score. */
export const INFORMAL_PASS_PERCENT = 75;

/**
 * Reference length used to scale timed exam duration.
 * PMP exam from July 2026: 180 questions in 240 minutes (PMI Examination Content Outline 2026).
 */
export const PMP_REFERENCE_QUESTION_COUNT = 180;
export const PMP_REFERENCE_MINUTES = 240;

export const EXAM_PRESET_COUNTS = [60, 90, 180];

/** 2026 ECO domain weighting (People 33%, Process 41%, Business Environment 26%). */
export const ECO_WEIGHTS = {
  People: 33,
  Process: 41,
  "Business Environment": 26,
};

/** Exam question sources offered on the setup screen. */
export const EXAM_SOURCES = {
  ALL: "all",
  PMBOK8_ECO: "pmbok8-eco",
  PMBOK8_MOCK: "pmbok8-mock",
};
