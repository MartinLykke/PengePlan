"use client";

import { useEffect, useState } from "react";

export const DARK_MODE_STORAGE_KEY = "myfinance.darkMode";
export const THEME_CHANGE_EVENT = "myfinance-theme-changed";

export function readInitialDarkMode(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  const attrTheme = document.documentElement.getAttribute("data-theme");
  if (attrTheme === "dark") {
    return true;
  }
  if (attrTheme === "light") {
    return false;
  }

  const stored = window.localStorage.getItem(DARK_MODE_STORAGE_KEY);
  if (stored === "1") {
    return true;
  }
  if (stored === "0") {
    return false;
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

export function applyDarkMode(nextIsDark: boolean) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(DARK_MODE_STORAGE_KEY, nextIsDark ? "1" : "0");
  document.documentElement.setAttribute("data-theme", nextIsDark ? "dark" : "light");
  window.dispatchEvent(new CustomEvent(THEME_CHANGE_EVENT, { detail: { isDarkMode: nextIsDark } }));
}

export function useAppTheme() {
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => readInitialDarkMode());

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", isDarkMode ? "dark" : "light");
  }, [isDarkMode]);

  useEffect(() => {
    const onThemeChanged = (event: Event) => {
      const customEvent = event as CustomEvent<{ isDarkMode?: boolean }>;
      if (typeof customEvent.detail?.isDarkMode === "boolean") {
        setIsDarkMode(customEvent.detail.isDarkMode);
      } else {
        setIsDarkMode(readInitialDarkMode());
      }
    };

    const onStorage = (event: StorageEvent) => {
      if (event.key === DARK_MODE_STORAGE_KEY) {
        setIsDarkMode(readInitialDarkMode());
      }
    };

    window.addEventListener(THEME_CHANGE_EVENT, onThemeChanged as EventListener);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(THEME_CHANGE_EVENT, onThemeChanged as EventListener);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  const toggleDarkMode = () => {
    const next = !isDarkMode;
    setIsDarkMode(next);
    applyDarkMode(next);
  };

  return { isDarkMode, setIsDarkMode, toggleDarkMode };
}

