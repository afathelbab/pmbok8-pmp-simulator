import { useEffect } from "react";
import { useTranslation } from "react-i18next";

/** Sets document dir/lang for RTL Arabic */
export default function RtlSync() {
  const { i18n } = useTranslation();

  useEffect(() => {
    const lng = i18n.language || "en";
    const ar = lng.startsWith("ar");
    document.documentElement.setAttribute("dir", ar ? "rtl" : "ltr");
    document.documentElement.setAttribute("lang", ar ? "ar" : "en");
  }, [i18n.language]);

  return null;
}
