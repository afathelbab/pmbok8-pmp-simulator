import React from "react";
import { Link, Navigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { INFORMAL_PASS_PERCENT } from "../constants/examConfig";
import {
  CHOICE_KEYS,
  domainBreakdown,
  scoreAnswers,
} from "../utils/quizUtils";

export default function ExamResultsPage() {
  const { t } = useTranslation();
  const location = useLocation();
  const { questions, answers, timedOut } = location.state || {};

  if (!questions?.length) {
    return <Navigate to="/exam" replace />;
  }

  const { correct, total, percent } = scoreAnswers(questions, answers || {});
  const passed = percent >= INFORMAL_PASS_PERCENT;
  const byDomain = domainBreakdown(questions, answers || {}, (q) =>
    q.pmbokDomain ? `PMBOK 8 · ${q.pmbokDomain}` : q.domainLabel
  );
  const hasEco = questions.some((q) => q.eco);
  const byEco = hasEco
    ? domainBreakdown(questions, answers || {}, (q) => q.eco || t("results.untagged"))
    : null;
  const byApproach = hasEco
    ? domainBreakdown(questions, answers || {}, (q) => q.approach || t("results.untagged"))
    : null;

  const renderTable = (rows, firstCol, order) => (
    <table className="domain-table">
      <thead>
        <tr>
          <th scope="col">{firstCol}</th>
          <th scope="col">{t("results.correct")}</th>
          <th scope="col">{t("results.total")}</th>
          <th scope="col">%</th>
        </tr>
      </thead>
      <tbody>
        {Object.entries(rows)
          .sort(([a], [b]) => {
            if (order) {
              const ia = order.indexOf(a);
              const ib = order.indexOf(b);
              return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib);
            }
            return a.localeCompare(b);
          })
          .map(([label, row]) => (
            <tr key={label}>
              <td>{label}</td>
              <td>{row.correct}</td>
              <td>{row.total}</td>
              <td>
                {row.total ? Math.round((100 * row.correct) / row.total) : 0}%
              </td>
            </tr>
          ))}
      </tbody>
    </table>
  );

  const statusText = passed ? t("results.atOrAbove") : t("results.below");

  return (
    <div className="quiz-container results-page">
      <h1>{t("results.title")}</h1>
      {timedOut ? (
        <p className="banner-warn" role="status">
          {t("results.timeExpired")}
        </p>
      ) : null}

      <section className="results-summary" aria-labelledby="summary-heading">
        <h2 id="summary-heading">{t("results.score")}</h2>
        <p className="big-score">
          {correct} / {total} ({percent}%)
        </p>
        <p>
          {t("results.informal", {
            pct: INFORMAL_PASS_PERCENT,
            status: statusText,
          })}
        </p>
      </section>

      {byEco ? (
        <section aria-labelledby="eco-heading">
          <h2 id="eco-heading">{t("results.byEco")}</h2>
          <p className="muted">{t("results.byEcoNote")}</p>
          {renderTable(byEco, t("results.ecoDomain"), [
            "People",
            "Process",
            "Business Environment",
          ])}
        </section>
      ) : null}

      {byApproach ? (
        <section aria-labelledby="approach-heading">
          <h2 id="approach-heading">{t("results.byApproach")}</h2>
          {renderTable(byApproach, t("results.approach"), [
            "Predictive",
            "Agile",
            "Hybrid",
          ])}
        </section>
      ) : null}

      <section aria-labelledby="domain-heading">
        <h2 id="domain-heading">{t("results.byDomain")}</h2>
        {renderTable(byDomain, t("results.domain"))}
      </section>

      <section aria-labelledby="review-heading">
        <h2 id="review-heading">{t("results.review")}</h2>
        <p>{t("results.reviewIntro")}</p>
        {questions.every((q, i) => {
          const a = answers?.[i];
          return (
            a &&
            String(a).toUpperCase() === String(q.correctAnswer).toUpperCase()
          );
        }) ? (
          <p className="results-perfect">{t("results.perfect")}</p>
        ) : null}
        <ul className="results-missed">
          {questions.flatMap((q, i) => {
            const a = answers?.[i];
            const ok =
              a &&
              String(a).toUpperCase() ===
                String(q.correctAnswer).toUpperCase();
            if (ok) return [];
            return [
              <li key={i} className="results-missed-item">
                <h3>{t("results.questionN", { n: i + 1 })}</h3>
                {q.domainLabel ? (
                  <p className="domain-tag">
                    {t("results.domainLine", {
                      name: q.pmbokDomain
                        ? `PMBOK 8 · ${q.pmbokDomain}`
                        : q.domainLabel,
                    })}
                    {q.eco ? ` · ECO: ${q.eco} (${q.ecoTask})` : ""}
                    {q.approach ? ` · ${q.approach}` : ""}
                  </p>
                ) : null}
                <p>{q.question}</p>
                <p>
                  {t("results.yourAnswer", {
                    a: a || t("results.none"),
                    c: q.correctAnswer,
                  })}
                </p>
                <ul className="answer-lines">
                  {CHOICE_KEYS.map((k) => (
                    <li key={k}>
                      <strong>{k}.</strong> {q.choices[k]}
                    </li>
                  ))}
                </ul>
                <p className="explanation">{q.explanation}</p>
              </li>,
            ];
          })}
        </ul>
      </section>

      <div className="summary-actions">
        <Link to="/exam" className="link-button">
          {t("results.newExam")}
        </Link>
        <Link to="/practice" className="link-button secondary">
          {t("results.domainPractice")}
        </Link>
        <Link to="/" className="link-button secondary">
          {t("results.home")}
        </Link>
      </div>
    </div>
  );
}
