import React from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

export default function HomePage() {
  const { t } = useTranslation();

  return (
    <div className="home-page">
      <div className="home-topbar">
        <Link className="lang-switch" to="/welcome">
          {t("home.changeLanguage")}
        </Link>
      </div>
      <h1>{t("home.title")}</h1>
      <p className="lead">{t("home.lead")}</p>
      <div className="home-actions">
        <Link className="home-card" to="/practice">
          <h2>{t("home.domainPractice")}</h2>
          <p>{t("home.domainPracticeDesc")}</p>
        </Link>
        <Link className="home-card" to="/exam">
          <h2>{t("home.timedExam")}</h2>
          <p>{t("home.timedExamDesc")}</p>
        </Link>
      </div>
    </div>
  );
}
