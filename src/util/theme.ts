export type Theme = "light" | "dark";

const THEME_STORAGE_KEY = "theme";
const THEME_CHANGE_EVENT = "themechange";

export const getCurrentTheme = (): Theme =>
  document.documentElement.dataset.theme === "dark" ? "dark" : "light";

export const subscribeTheme = (onChange: () => void) => {
  window.addEventListener(THEME_CHANGE_EVENT, onChange);
  return () => window.removeEventListener(THEME_CHANGE_EVENT, onChange);
};

export const getStoredTheme = (): Theme => {
  try {
    return window.localStorage.getItem(THEME_STORAGE_KEY) === "dark"
      ? "dark"
      : "light";
  } catch {
    return "light";
  }
};

export const setTheme = (theme: Theme) => {
  document.documentElement.dataset.theme = theme;
  document.documentElement.dataset.colorMode = theme;
  window.dispatchEvent(new Event(THEME_CHANGE_EVENT));

  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // Storage may be unavailable; the selected theme still applies to this page.
  }
};
