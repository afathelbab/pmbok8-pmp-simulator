import React from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import i18n from "../i18n";
import { APP_LANGUAGE_KEY } from "../utils/quizLocale";

export default function LanguageWelcomePage() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const choose = (lng) => {
    try {
      localStorage.setItem(APP_LANGUAGE_KEY, lng);
    } catch {
      /* ignore */
    }
    i18n.changeLanguage(lng);
    navigate("/", { replace: true });
  };

  return (
    <div className="welcome-page">
      <h1>{t("welcome.title")}</h1>
      <p className="welcome-sub">{t("welcome.subtitle")}</p>
      <div className="welcome-actions">
        <button
          type="button"
          className="welcome-btn"
          onClick={() => choose("en")}
          lang="en"
        >
          {t("welcome.english")}
        </button>
        <button
          type="button"
          className="welcome-btn welcome-btn-ar"
          onClick={() => choose("ar")}
          lang="ar"
        >
          {t("welcome.arabic")}
        </button>
      </div>
      <p className="welcome-note">
        {t("home.lead")}
      </p>
    </div>
  );
}
