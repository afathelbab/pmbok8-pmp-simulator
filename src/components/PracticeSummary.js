import React from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

/**
 * @param {{
 *   categoryLabel: string,
 *   total: number,
 *   correct: number,
 *   missed: Array<{ question: string, userAnswer: string | null, correctAnswer: string, explanation: string }>,
 * }} props
 */
export default function PracticeSummary({
  categoryLabel,
  total,
  correct,
  missed,
}) {
  const { t } = useTranslation();
  const pct = total ? Math.round((100 * correct) / total) : 0;

  return (
    <div className="summary-panel">
      <h2>{t("summary.title")}</h2>
      <p className="summary-score">
        {t("summary.scoreLine", {
          label: categoryLabel,
          correct,
          total,
          pct,
        })}
      </p>
      {missed.length > 0 ? (
        <>
          <h3>{t("summary.reviewTitle", { count: missed.length })}</h3>
          <ul className="missed-list">
            {missed.map((m, i) => (
              <li key={i} className="missed-item">
                <p className="missed-question">{m.question}</p>
                <p className="missed-detail">
                  {t("summary.yourAnswer", {
                    a: m.userAnswer || t("results.none"),
                    c: m.correctAnswer,
                  })}
                </p>
                <p className="missed-explanation">{m.explanation}</p>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <p>{t("summary.perfect")}</p>
      )}
      <div className="summary-actions">
        <Link to="/practice" className="link-button">
          {t("summary.backCategories")}
        </Link>
        <Link to="/" className="link-button secondary">
          {t("summary.home")}
        </Link>
      </div>
    </div>
  );
}
