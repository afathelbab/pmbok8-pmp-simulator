import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { fetchCategoryRaw, fetchManifest } from "../api/quizDataApi";
import PracticeSummary from "../components/PracticeSummary";
import QuestionPanel from "../components/QuestionPanel";
import {
  createNameMapper,
  readRandomizeNamesPreference,
} from "../utils/nameSubstitution";
import { isArabicLocale } from "../utils/quizLocale";
import { shuffleArray, transformData } from "../utils/quizUtils";

export default function PracticeQuizPage() {
  const { t } = useTranslation();
  const { categoryId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const shuffle = searchParams.get("shuffle") === "1";

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [categoryLabel, setCategoryLabel] = useState("");
  const [questions, setQuestions] = useState([]);

  const [phase, setPhase] = useState("quiz"); // quiz | summary
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showExplanation, setShowExplanation] = useState(false);
  /** @type {Record<number, { userAnswer: string, correct: boolean, question: string, correctAnswer: string, explanation: string }>} */
  const [attempts, setAttempts] = useState({});

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!categoryId) return;
      setLoading(true);
      setError(null);
      try {
        const manifest = await fetchManifest();
        const meta = manifest.categories.find((c) => c.id === categoryId);
        if (!meta) {
          throw new Error("UNKNOWN_CATEGORY");
        }
        if (!cancelled) setCategoryLabel(meta.label);
        const raw = await fetchCategoryRaw(meta.file);
        let transformed = transformData(raw, {
          domainId: meta.id,
          domainLabel: meta.label,
        });
        if (shuffle) {
          transformed = shuffleArray(transformed);
        }
        const seed = Math.floor(Math.random() * 0x7fffffff);
        const randomize =
          readRandomizeNamesPreference() && !isArabicLocale();
        const mapper = createNameMapper(seed, randomize);
        const display = transformed.map((q) => mapper.mapQuestion(q));
        if (!cancelled) {
          setQuestions(display);
          setCurrentIndex(0);
          setSelectedAnswer(null);
          setShowExplanation(false);
          setAttempts({});
          setPhase("quiz");
        }
      } catch (e) {
        if (!cancelled) {
          if (e instanceof Error && e.message === "UNKNOWN_CATEGORY") {
            setError(t("quiz.unknownCategory"));
          } else {
            setError(t("practice.loadError"));
          }
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [categoryId, shuffle, t]);

  const q = questions[currentIndex];
  const total = questions.length;
  const progressLabel =
    total > 0
      ? t("quiz.questionProgress", {
          current: currentIndex + 1,
          total,
        })
      : "";

  const handleAnswerSelect = (key) => {
    if (!q) return;
    setSelectedAnswer(key);
    setShowExplanation(true);
    const correct =
      String(key).toUpperCase() === String(q.correctAnswer).toUpperCase();
    setAttempts((prev) => ({
      ...prev,
      [currentIndex]: {
        userAnswer: key,
        correct,
        question: q.question,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation,
      },
    }));
  };

  const handleNext = () => {
    if (selectedAnswer == null) return;
    if (currentIndex < total - 1) {
      setCurrentIndex((i) => i + 1);
      setSelectedAnswer(null);
      setShowExplanation(false);
    } else {
      setPhase("summary");
    }
  };

  if (loading) {
    return (
      <div className="center-message">
        <p>{t("quiz.loading")}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="center-message error">
        <p>{error}</p>
        <Link to="/practice" className="link-button">
          {t("quiz.backCategories")}
        </Link>
      </div>
    );
  }

  if (!total) {
    return (
      <div className="center-message">
        <p>{t("quiz.noQuestions")}</p>
        <Link to="/practice">{t("quiz.back")}</Link>
      </div>
    );
  }

  if (phase === "summary") {
    const values = Object.values(attempts);
    const correctCount = values.filter((a) => a.correct).length;
    const missed = values
      .filter((a) => !a.correct)
      .map((a) => ({
        question: a.question,
        userAnswer: a.userAnswer,
        correctAnswer: a.correctAnswer,
        explanation: a.explanation,
      }));

    return (
      <PracticeSummary
        categoryLabel={categoryLabel}
        total={total}
        correct={correctCount}
        missed={missed}
      />
    );
  }

  const runningCorrect = Object.values(attempts).filter((a) => a.correct).length;
  const answeredSoFar = Object.keys(attempts).length;

  return (
    <div className="quiz-container">
      <div className="quiz-toolbar">
        <button
          type="button"
          className="link-button secondary"
          onClick={() => navigate("/practice")}
        >
          {t("quiz.categories")}
        </button>
        <span className="progress-text">{progressLabel}</span>
        <span className="running-score" aria-live="polite">
          {t("quiz.scoreRunning", {
            correct: runningCorrect,
            answered: answeredSoFar,
          })}
        </span>
      </div>
      <h2 className="quiz-heading">{categoryLabel}</h2>

      <QuestionPanel
        question={q}
        selectedAnswer={selectedAnswer}
        onSelectAnswer={handleAnswerSelect}
        showFeedback={showExplanation && !!selectedAnswer}
        showExplanation={showExplanation}
        disabled={false}
      />

      <div className="navigation-buttons">
        <button
          type="button"
          className="next-button"
          onClick={handleNext}
          disabled={selectedAnswer == null}
        >
          {currentIndex < total - 1 ? t("quiz.next") : t("quiz.finish")}
        </button>
      </div>
    </div>
  );
}
