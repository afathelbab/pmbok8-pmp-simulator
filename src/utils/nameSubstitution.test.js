import {
  applyCaseLikeSample,
  createNameMapper,
  mulberry32,
} from "./nameSubstitution";

describe("applyCaseLikeSample", () => {
  it("preserves ALL CAPS", () => {
    expect(applyCaseLikeSample("Jordan", "ANTHONY")).toBe("JORDAN");
  });

  it("preserves Title Case", () => {
    expect(applyCaseLikeSample("jordan", "Anthony")).toBe("Jordan");
  });

  it("preserves lowercase", () => {
    expect(applyCaseLikeSample("Jordan", "anthony")).toBe("jordan");
  });
});

describe("createNameMapper", () => {
  it("is identity when disabled", () => {
    const m = createNameMapper(12345, false);
    expect(m.mapText("Anthony is a PM.")).toBe("Anthony is a PM.");
  });

  it("replaces known names deterministically for a fixed seed", () => {
    const m1 = createNameMapper(42, true);
    const m2 = createNameMapper(42, true);
    const a = m1.mapText("Anthony is a PM.");
    const b = m2.mapText("Anthony is a PM.");
    expect(a).toBe(b);
    expect(a).not.toContain("Anthony");
  });

  it("maps question objects", () => {
    const m = createNameMapper(99, true);
    const q = {
      question: "Anthony leads the team.",
      choices: { A: "A) Yes", B: "B) No", C: "C) Maybe", D: "D) N/A" },
      correctAnswer: "A",
      explanation: "Anthony agreed.",
    };
    const out = m.mapQuestion(q);
    expect(out.correctAnswer).toBe("A");
    expect(out.question).not.toContain("Anthony");
    expect(out.explanation).not.toContain("Anthony");
  });
});

describe("mulberry32", () => {
  it("returns values in [0, 1)", () => {
    const r = mulberry32(1);
    for (let i = 0; i < 20; i++) {
      const x = r();
      expect(x).toBeGreaterThanOrEqual(0);
      expect(x).toBeLessThan(1);
    }
  });
});
