// Theme override on top of tokens.css's `prefers-color-scheme` default.
// "system" means no override -- the OS/browser setting decides, same as
// before this existed. Persisted so the choice survives reloads; index.html
// reads the same localStorage key in an inline script to avoid a flash of
// the wrong theme before this module ever runs.
export type ThemePreference = "light" | "dark" | "system";

const STORAGE_KEY = "tc-theme";

export function getStoredTheme(): ThemePreference {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === "light" || stored === "dark" ? stored : "system";
  } catch {
    return "system";
  }
}

function apply(theme: ThemePreference): void {
  if (theme === "system") {
    document.documentElement.removeAttribute("data-theme");
  } else {
    document.documentElement.setAttribute("data-theme", theme);
  }
}

export function initTheme(): void {
  apply(getStoredTheme());
}

export function setTheme(theme: ThemePreference): void {
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    // Private browsing / storage disabled -- theme just won't persist.
  }
  apply(theme);
}

export function resolveIsDark(): boolean {
  const stored = getStoredTheme();
  if (stored === "dark") return true;
  if (stored === "light") return false;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}
