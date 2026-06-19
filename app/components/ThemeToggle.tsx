"use client";

import { useEffect, useState } from "react";

type ThemeMode = "dark" | "light";

function getStoredTheme(): ThemeMode {
  if (typeof window === "undefined") {
    return "dark";
  }

  return window.localStorage.getItem("theme-mode") === "light" ? "light" : "dark";
}

function applyTheme(theme: ThemeMode) {
  document.documentElement.dataset.theme = theme;
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<ThemeMode>(() => getStoredTheme());

  useEffect(() => {
    console.log("[component:ThemeToggle] applying theme", theme);
    applyTheme(theme);
  }, [theme]);

  function toggleTheme() {
    const nextTheme = theme === "dark" ? "light" : "dark";
    console.log("[component:ThemeToggle] switching theme", nextTheme);
    setTheme(nextTheme);
    window.localStorage.setItem("theme-mode", nextTheme);
    applyTheme(nextTheme);
  }

  return (
    <button
      aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} display`}
      className="theme-toggle fixed z-50 inline-flex items-center justify-center rounded-full border px-3 py-2 text-xs font-semibold uppercase tracking-normal backdrop-blur transition"
      onClick={toggleTheme}
      suppressHydrationWarning
      type="button"
    >
      {theme === "dark" ? "Light" : "Dark"}
    </button>
  );
}
