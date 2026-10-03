import React from "react";
import { useTranslation } from "react-i18next";

const GROUP_ORDER = ["pmbok8", "pmbok8-mock", "classic"];

/**
 * @param {{
 *   categories: Array<{ id: string, label: string, questionCount: number, group?: string }>,
 *   onSelect: (categoryId: string) => void,
 * }} props
 */
export default function CategorySelection({ categories, onSelect }) {
  const { t } = useTranslation();

  const groups = GROUP_ORDER.map((g) => ({
    id: g,
    items: categories.filter((c) => (c.group || "classic") === g),
  })).filter((g) => g.items.length);

  const renderCard = (c) => (
    <div
      key={c.id}
      className={`category-card${c.group && c.group.startsWith("pmbok8") ? " category-card--p8" : ""}`}
      role="button"
      tabIndex={0}
      onClick={() => onSelect(c.id)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect(c.id);
        }
      }}
    >
      <span className="category-name">{c.label.replace(/^PMBOK 8 · /, "")}</span>
      <span className="category-count">
        {t("practice.questionsCount", { count: c.questionCount })}
      </span>
    </div>
  );

  return (
    <div className="category-container">
      <h1>{t("practice.heading")}</h1>
      {groups.map((g) => (
        <section key={g.id} className="category-group" aria-labelledby={`grp-${g.id}`}>
          <h2 id={`grp-${g.id}`} className="category-group-title">
            {t(`practice.group.${g.id}`)}
          </h2>
          <p className="category-group-desc">{t(`practice.groupDesc.${g.id}`)}</p>
          <div className="category-list">{g.items.map(renderCard)}</div>
        </section>
      ))}
    </div>
  );
}
