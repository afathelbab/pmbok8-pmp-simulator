import React from "react";
import { HashRouter, Navigate, Route, Routes } from "react-router-dom";
import "./styles.css";
import RtlSync from "./components/RtlSync";
import LangGate from "./components/LangGate";
import ExamQuizPage from "./pages/ExamQuizPage";
import ExamResultsPage from "./pages/ExamResultsPage";
import ExamSetupPage from "./pages/ExamSetupPage";
import HomePage from "./pages/HomePage";
import LanguageWelcomePage from "./pages/LanguageWelcomePage";
import PracticeListPage from "./pages/PracticeListPage";
import PracticeQuizPage from "./pages/PracticeQuizPage";

export default function App() {
  return (
    <HashRouter>
      <RtlSync />
      <div className="app-container">
        <Routes>
          <Route path="/welcome" element={<LanguageWelcomePage />} />
          <Route element={<LangGate />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/practice" element={<PracticeListPage />} />
            <Route path="/practice/:categoryId" element={<PracticeQuizPage />} />
            <Route path="/exam" element={<ExamSetupPage />} />
            <Route path="/exam/quiz" element={<ExamQuizPage />} />
            <Route path="/exam/results" element={<ExamResultsPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </HashRouter>
  );
}
