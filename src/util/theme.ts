export type Theme = "light" | "dark";

const THEME_STORAGE_KEY = "theme";
const THEME_CHANGE_EVENT = "themechange";

export const getCurrentTheme = (): Theme =>
  document.documentElement.dataset.theme === "dark" ? "dark" : "light";

export const subscribeTheme = (onChange: () => void) => {
  window.addEventListener(THEME_CHANGE_EVENT, onChange);
  return () => window.removeEventListener(THEME_CHANGE_EVENT, onChange);
};

const getPreferredTheme = (): Theme => {
  try {
    const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (storedTheme === "light" || storedTheme === "dark") {
      return storedTheme;
    }
  } catch {
    // Storage may be unavailable; use the device preference below.
  }

  try {
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  } catch {
    return "light";
  }
};

const applyTheme = (theme: Theme) => {
  const hasChanged = document.documentElement.dataset.theme !== theme;
  document.documentElement.dataset.theme = theme;
  document.documentElement.dataset.colorMode = theme;
  if (hasChanged) window.dispatchEvent(new Event(THEME_CHANGE_EVENT));
};

const handleStorageChange = (event: StorageEvent) => {
  if (event.key === THEME_STORAGE_KEY || event.key === null) {
    applyTheme(getPreferredTheme());
  }
};

export const initializeTheme = () => {
  applyTheme(getPreferredTheme());
  window.addEventListener("storage", handleStorageChange);
};

export const setTheme = (theme: Theme) => {
  applyTheme(theme);

  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // Storage may be unavailable; the selected theme still applies to this page.
  }
};
