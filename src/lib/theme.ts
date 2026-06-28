import { useEffect, useState } from "react";

export const THEME_STORAGE_KEY = "skitech_theme";

export function getStoredThemeIsDark(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(THEME_STORAGE_KEY) === "dark";
}

export function applyTheme(isDark: boolean) {
  if (typeof document === "undefined") return;
  if (isDark) {
    document.documentElement.setAttribute("data-theme", "dark");
    document.documentElement.classList.add("dark");
  } else {
    document.documentElement.removeAttribute("data-theme");
    document.documentElement.classList.remove("dark");
  }
}

/** Inline script run before paint to avoid a flash of the wrong theme. */
export const themeInitScript = `(function(){var t=localStorage.getItem('${THEME_STORAGE_KEY}');if(t==='dark'){document.documentElement.setAttribute('data-theme','dark');document.documentElement.classList.add('dark');}})();`;

export function useTheme() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    setIsDark(getStoredThemeIsDark());
  }, []);

  function toggleTheme() {
    setIsDark((current) => {
      const next = !current;
      localStorage.setItem(THEME_STORAGE_KEY, next ? "dark" : "light");
      applyTheme(next);
      return next;
    });
  }

  return { isDark, toggleTheme };
}
