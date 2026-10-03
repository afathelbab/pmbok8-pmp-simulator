import { render, screen } from "@testing-library/react";
import { I18nextProvider } from "react-i18next";
import App from "./App";
import i18n from "./i18n";
import { APP_LANGUAGE_KEY } from "./utils/quizLocale";

beforeEach(() => {
  localStorage.setItem(APP_LANGUAGE_KEY, "en");
});

test("renders home heading", () => {
  render(
    <I18nextProvider i18n={i18n}>
      <App />
    </I18nextProvider>
  );
  expect(
    screen.getByRole("heading", { name: /PMP practice simulator/i })
  ).toBeInTheDocument();
});
