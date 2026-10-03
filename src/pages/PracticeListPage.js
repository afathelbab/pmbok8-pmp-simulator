import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { fetchManifest } from "../api/quizDataApi";
import CategorySelection from "../components/CategorySelection";
import {
  readRandomizeNamesPreference,
  writeRandomizeNamesPreference,
} from "../utils/nameSubstitution";

export default function PracticeListPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [shuffle, setShuffle] = useState(false);
  const [randomizeNames, setRandomizeNames] = useState(() =>
    readRandomizeNamesPreference()
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const m = await fetchManifest();
        if (!cancelled) setCategories(m.categories || []);
      } catch (e) {
        if (!cancelled) setError(t("practice.loadError"));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [t]);

  const handleSelect = (categoryId) => {
    const qs = shuffle ? "?shuffle=1" : "";
    navigate(`/practice/${categoryId}${qs}`);
  };

  if (loading) {
    return (
      <div className="center-message">
        <p>{t("practice.loading")}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="center-message error">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div>
      <div className="toolbar">
        <label className="shuffle-toggle">
          <input
            type="checkbox"
            checked={shuffle}
            onChange={(e) => setShuffle(e.target.checked)}
          />
          {t("practice.shuffle")}
        </label>
        <label className="shuffle-toggle">
          <input
            type="checkbox"
            checked={randomizeNames}
            onChange={(e) => {
              const v = e.target.checked;
              setRandomizeNames(v);
              writeRandomizeNamesPreference(v);
            }}
          />
          {t("practice.randomizeNames")}
        </label>
        <button
          type="button"
          className="link-button secondary"
          onClick={() => navigate("/")}
        >
          {t("practice.home")}
        </button>
      </div>
      <CategorySelection categories={categories} onSelect={handleSelect} />
    </div>
  );
}
