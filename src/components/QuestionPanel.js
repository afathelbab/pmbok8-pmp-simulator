import React, { useEffect, useId } from "react";
import { useTranslation } from "react-i18next";
import { CHOICE_KEYS, keyToChoiceKey } from "../utils/quizUtils";

/**
 * @param {{
 *   question: import('../utils/quizUtils').QuizQuestion,
 *   selectedAnswer: string | null,
 *   onSelectAnswer: (key: string) => void,
 *   showFeedback: boolean,
 *   showExplanation: boolean,
 *   disabled?: boolean,
 *   questionMeta?: string,
 * }} props
 */
export default function QuestionPanel({
  question,
  selectedAnswer,
  onSelectAnswer,
  showFeedback,
  showExplanation,
  disabled = false,
  questionMeta,
}) {
  const { t } = useTranslation();
  const titleId = useId();
  const liveId = useId();

  useEffect(() => {
    function onKeyDown(e) {
      if (disabled) return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const choice = keyToChoiceKey(e.key);
      if (choice) {
        e.preventDefault();
        onSelectAnswer(choice);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [disabled, onSelectAnswer]);

  const isCorrect =
    selectedAnswer &&
    String(selectedAnswer).toUpperCase() === question.correctAnswer;

  const correctLabel = t("quiz.correctShort");
  const incorrectLabel = t("quiz.incorrectShort");

  return (
    <div className="question-section">
      {questionMeta ? <p className="question-meta">{questionMeta}</p> : null}
      <h3 className="question-title" id={titleId}>
        {question.question}
      </h3>

      <div
        className="choices-container"
        role="radiogroup"
        aria-labelledby={titleId}
      >
        {CHOICE_KEYS.map((key) => {
          const choiceText = question.choices[key];
          const selected = selectedAnswer === key;
          const showCorr =
            showFeedback && question.correctAnswer === key;
          const showWrong =
            showFeedback && selected && question.correctAnswer !== key;
          return (
            <button
              key={key}
              type="button"
              role="radio"
              aria-checked={selected}
              disabled={disabled}
              className={[
                "choice-button",
                selected ? "selected" : "",
                showCorr ? "choice-correct" : "",
                showWrong ? "choice-wrong" : "",
              ]
                .filter(Boolean)
                .join(" ")}
              onClick={() => !disabled && onSelectAnswer(key)}
            >
              <span className="choice-key">{key}.</span> {choiceText}
            </button>
          );
        })}
      </div>

      <div id={liveId} className="sr-only" aria-live="polite">
        {showFeedback && selectedAnswer
          ? isCorrect
            ? correctLabel
            : incorrectLabel
          : ""}
      </div>

      {showExplanation && showFeedback ? (
        <div
          className="explanation"
          role="region"
          aria-label={t("a11y.explanation")}
        >
          <p>
            {isCorrect ? `${correctLabel} ` : `${incorrectLabel} `}
            {question.explanation}
          </p>
        </div>
      ) : null}
    </div>
  );
}
