/** Sync with LanguageWelcomePage + i18n */
export const APP_LANGUAGE_KEY = "pmp_app_language";

/** @returns {'en'|'ar'} */
export function getQuizLocale() {
  try {
    if (typeof window === "undefined") return "en";
    return localStorage.getItem(APP_LANGUAGE_KEY) === "ar" ? "ar" : "en";
  } catch {
    return "en";
  }
}

export function isArabicLocale() {
  return getQuizLocale() === "ar";
}
