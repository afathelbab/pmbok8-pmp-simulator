import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import QuestionPanel from "../components/QuestionPanel";
import {
  createNameMapper,
  readRandomizeNamesPreference,
} from "../utils/nameSubstitution";
import { isArabicLocale } from "../utils/quizLocale";

function formatTime(totalSec) {
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default function ExamQuizPage() {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const payload = location.state;

  const timeLimitSec = payload?.timeLimitSec ?? 0;

  const [nameSeed] = useState(() => Math.floor(Math.random() * 0x7fffffff));

  const questionList = payload?.questions;

  const questions = useMemo(() => {
    const raw = questionList ?? [];
    const randomize =
      readRandomizeNamesPreference() && !isArabicLocale();
    const mapper = createNameMapper(nameSeed, randomize);
    return raw.map((q) => mapper.mapQuestion(q));
  }, [questionList, nameSeed]);

  const [currentIndex, setCurrentIndex] = useState(0);
  /** @type {Record<number, string>} */
  const [answers, setAnswers] = useState({});
  /** @type {Record<number, boolean>} */
  const [flagged, setFlagged] = useState({});
  const [timeLeft, setTimeLeft] = useState(() =>
    Math.max(0, Math.floor(timeLimitSec))
  );

  const finishedRef = useRef(false);
  const answersRef = useRef(answers);
  const flaggedRef = useRef(flagged);

  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);

  useEffect(() => {
    flaggedRef.current = flagged;
  }, [flagged]);

  useEffect(() => {
    finishedRef.current = false;
  }, [questions, timeLimitSec]);

  const completeExam = useCallback(
    (timedOut) => {
      if (finishedRef.current) return;
      finishedRef.current = true;
      navigate("/exam/results", {
        state: {
          questions,
          answers: answersRef.current,
          flagged: flaggedRef.current,
          timedOut: !!timedOut,
        },
      });
    },
    [navigate, questions]
  );

  useEffect(() => {
    if (!questions?.length) return;
    if (finishedRef.current) return;
    if (timeLeft <= 0) {
      completeExam(true);
      return;
    }
    const id = setTimeout(() => setTimeLeft((x) => x - 1), 1000);
    return () => clearTimeout(id);
  }, [timeLeft, questions, completeExam]);

  const q = questions?.[currentIndex];
  const total = questions?.length ?? 0;

  const handleSelect = useCallback(
    (key) => {
      setAnswers((prev) => {
        const next = { ...prev, [currentIndex]: key };
        answersRef.current = next;
        return next;
      });
    },
    [currentIndex]
  );

  const toggleFlag = () => {
    setFlagged((f) => {
      const next = { ...f, [currentIndex]: !f[currentIndex] };
      flaggedRef.current = next;
      return next;
    });
  };

  if (!questions?.length) {
    return <Navigate to="/exam" replace />;
  }

  return (
    <div className="quiz-container exam-quiz">
      <div className="exam-header">
        <Link to="/" className="link-button secondary">
          {t("exam.home")}
        </Link>
        <div className="exam-timer" role="status" aria-live="polite">
          {t("exam.timer", { time: formatTime(timeLeft) })}
        </div>
        <span className="progress-text">
          {t("exam.questionProgress", {
            current: currentIndex + 1,
            total,
          })}
        </span>
      </div>

      {q ? (
        <QuestionPanel
          question={q}
          selectedAnswer={answers[currentIndex] ?? null}
          onSelectAnswer={handleSelect}
          showFeedback={false}
          showExplanation={false}
          questionMeta={
            q.domainLabel
              ? t("results.domainLine", { name: q.domainLabel })
              : undefined
          }
        />
      ) : null}

      <div className="exam-controls">
        <button
          type="button"
          className="nav-btn"
          onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
          disabled={currentIndex === 0}
        >
          {t("exam.previous")}
        </button>
        <button
          type="button"
          className={`nav-btn ${flagged[currentIndex] ? "flag-active" : ""}`}
          onClick={toggleFlag}
          aria-pressed={!!flagged[currentIndex]}
        >
          {t("exam.flagReview")}
        </button>
        <button
          type="button"
          className="nav-btn"
          onClick={() =>
            setCurrentIndex((i) => Math.min(total - 1, i + 1))
          }
          disabled={currentIndex >= total - 1}
        >
          {t("exam.next")}
        </button>
        <button
          type="button"
          className="next-button"
          onClick={() => completeExam(false)}
        >
          {t("exam.submit")}
        </button>
      </div>
    </div>
  );
}
