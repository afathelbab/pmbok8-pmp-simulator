import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { fetchManifest, fetchCategoryRaw } from "../api/quizDataApi";
import {
  EXAM_PRESET_COUNTS,
  EXAM_SOURCES,
  PMP_REFERENCE_MINUTES,
  PMP_REFERENCE_QUESTION_COUNT,
} from "../constants/examConfig";
import {
  examMinutesForQuestionCount,
  sampleEcoWeighted,
  sampleQuestions,
  shuffleArray,
  transformData,
} from "../utils/quizUtils";
import {
  readRandomizeNamesPreference,
  writeRandomizeNamesPreference,
} from "../utils/nameSubstitution";

export default function ExamSetupPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [manifest, setManifest] = useState(null);
  const [loadingManifest, setLoadingManifest] = useState(true);
  const [loadError, setLoadError] = useState(null);

  const [source, setSource] = useState(EXAM_SOURCES.ALL);
  const [questionCount, setQuestionCount] = useState(60);
  const [minutes, setMinutes] = useState(() =>
    examMinutesForQuestionCount(60)
  );
  const [starting, setStarting] = useState(false);
  const [startError, setStartError] = useState(null);
  const [randomizeNames, setRandomizeNames] = useState(() =>
    readRandomizeNamesPreference()
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const m = await fetchManifest();
        if (!cancelled) setManifest(m);
      } catch (e) {
        if (!cancelled) setLoadError(t("exam.loadFailed"));
      } finally {
        if (!cancelled) setLoadingManifest(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [t]);

  useEffect(() => {
    setMinutes(examMinutesForQuestionCount(questionCount));
  }, [questionCount]);

  const categories = manifest?.categories || [];
  const mockCategory = categories.find((c) => c.group === "pmbok8-mock");
  const hasPmbok8 = categories.some((c) => String(c.group || "").startsWith("pmbok8"));

  const chooseSource = (value) => {
    setSource(value);
    if (value === EXAM_SOURCES.PMBOK8_MOCK && mockCategory) {
      setQuestionCount(mockCategory.questionCount);
    }
  };

  const categoriesForSource = () => {
    if (source === EXAM_SOURCES.PMBOK8_MOCK) return mockCategory ? [mockCategory] : [];
    if (source === EXAM_SOURCES.PMBOK8_ECO) {
      return categories.filter((c) => String(c.group || "").startsWith("pmbok8"));
    }
    return categories;
  };

  const handleStart = async () => {
    if (!manifest) return;
    setStarting(true);
    setStartError(null);
    try {
      const rawChunks = await Promise.all(
        categoriesForSource().map(async (c) => {
          const raw = await fetchCategoryRaw(c.file);
          return transformData(raw, {
            domainId: c.id,
            domainLabel: c.label,
          });
        })
      );
      const pool = rawChunks.flat();
      const n = Math.min(
        Math.max(1, Number(questionCount) || 1),
        pool.length
      );
      let picked;
      if (source === EXAM_SOURCES.PMBOK8_MOCK) {
        picked = shuffleArray(pool);
      } else if (source === EXAM_SOURCES.PMBOK8_ECO) {
        picked = sampleEcoWeighted(pool, n);
      } else {
        picked = sampleQuestions(pool, n);
      }
      if (!picked.length) throw new Error("empty pool");
      const timeLimitSec = Math.max(60, Math.round(Number(minutes) * 60) || 60);
      navigate("/exam/quiz", {
        state: {
          questions: picked,
          timeLimitSec,
        },
      });
    } catch (e) {
      setStartError(t("exam.buildFailed"));
    } finally {
      setStarting(false);
    }
  };

  if (loadingManifest) {
    return (
      <div className="center-message">
        <p>{t("exam.loading")}</p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="center-message error">
        <p>{loadError}</p>
        <Link to="/">{t("exam.home")}</Link>
      </div>
    );
  }

  return (
    <div className="exam-setup quiz-container">
      <h1>{t("exam.setupTitle")}</h1>
      <p className="exam-setup-intro">
        {t("exam.setupIntro", {
          minutes: PMP_REFERENCE_MINUTES,
          questions: PMP_REFERENCE_QUESTION_COUNT,
        })}
      </p>

      <div className="exam-setup-form">
        {hasPmbok8 ? (
          <fieldset className="field source-fieldset">
            <legend className="field-label">{t("exam.source")}</legend>
            <label className="radio-field">
              <input
                type="radio"
                name="exam-source"
                checked={source === EXAM_SOURCES.ALL}
                onChange={() => chooseSource(EXAM_SOURCES.ALL)}
              />
              <span>
                <strong>{t("exam.sourceAll")}</strong>
                <small>{t("exam.sourceAllDesc")}</small>
              </span>
            </label>
            <label className="radio-field">
              <input
                type="radio"
                name="exam-source"
                checked={source === EXAM_SOURCES.PMBOK8_ECO}
                onChange={() => chooseSource(EXAM_SOURCES.PMBOK8_ECO)}
              />
              <span>
                <strong>{t("exam.sourceEco")}</strong>
                <small>{t("exam.sourceEcoDesc")}</small>
              </span>
            </label>
            {mockCategory ? (
              <label className="radio-field">
                <input
                  type="radio"
                  name="exam-source"
                  checked={source === EXAM_SOURCES.PMBOK8_MOCK}
                  onChange={() => chooseSource(EXAM_SOURCES.PMBOK8_MOCK)}
                />
                <span>
                  <strong>{t("exam.sourceMock")}</strong>
                  <small>
                    {t("exam.sourceMockDesc", {
                      count: mockCategory.questionCount,
                    })}
                  </small>
                </span>
              </label>
            ) : null}
          </fieldset>
        ) : null}

        <div className="field">
          <span className="field-label">{t("exam.presets")}</span>
          <div className="preset-row">
            {EXAM_PRESET_COUNTS.map((n) => (
              <button
                key={n}
                type="button"
                className="preset-btn"
                disabled={source === EXAM_SOURCES.PMBOK8_MOCK}
                onClick={() => setQuestionCount(n)}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        <label className="field">
          {t("exam.numQuestions")}
          <input
            type="number"
            min={1}
            max={5000}
            value={questionCount}
            disabled={source === EXAM_SOURCES.PMBOK8_MOCK}
            onChange={(e) =>
              setQuestionCount(Math.max(1, Number(e.target.value) || 1))
            }
          />
        </label>

        <label className="field">
          {t("exam.timeMinutes")}
          <input
            type="number"
            min={1}
            max={600}
            value={minutes}
            onChange={(e) => setMinutes(Number(e.target.value))}
          />
        </label>

        <label className="field checkbox-field">
          <input
            type="checkbox"
            checked={randomizeNames}
            onChange={(e) => {
              const v = e.target.checked;
              setRandomizeNames(v);
              writeRandomizeNamesPreference(v);
            }}
          />
          {t("exam.randomizeNames")}
        </label>

        {startError ? <p className="error-text">{startError}</p> : null}

        <div className="exam-setup-actions">
          <button
            type="button"
            className="next-button"
            onClick={handleStart}
            disabled={starting}
          >
            {starting ? t("exam.preparing") : t("exam.start")}
          </button>
          <Link to="/" className="link-button secondary">
            {t("exam.cancel")}
          </Link>
        </div>
      </div>
    </div>
  );
}
