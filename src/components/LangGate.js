import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { APP_LANGUAGE_KEY } from "../utils/quizLocale";

export default function LangGate() {
  try {
    const v = localStorage.getItem(APP_LANGUAGE_KEY);
    if (v !== "en" && v !== "ar") {
      return <Navigate to="/welcome" replace />;
    }
  } catch {
    return <Navigate to="/welcome" replace />;
  }
  return <Outlet />;
}
