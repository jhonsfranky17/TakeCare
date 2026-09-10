import { useState } from "react";
import { resolveIsDark, setTheme } from "../lib/theme";
import { MoonIcon, SunIcon } from "../ui/icons";

/** A single button that flips between light and dark, overriding the
 * system default once tapped. Lives on the Family screen, the closest
 * thing this app has to a personal-settings area. */
export function ThemeToggle(): JSX.Element {
  const [isDark, setIsDark] = useState(resolveIsDark);

  const toggle = (): void => {
    const next = !isDark;
    setTheme(next ? "dark" : "light");
    setIsDark(next);
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        width: "100%",
        border: "1px solid var(--tc-line)",
        background: "var(--tc-card)",
        borderRadius: "var(--tc-r-card)",
        padding: "14px 16px",
        fontFamily: "var(--tc-font)",
        cursor: "pointer",
      }}
    >
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: 13,
          flex: "none",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "var(--tc-pill)",
          color: "var(--tc-ok-ink)",
        }}
      >
        {isDark ? <MoonIcon size={19} /> : <SunIcon size={19} />}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 1, textAlign: "left" }}>
        <div style={{ fontSize: 15.5, fontWeight: 600, color: "var(--tc-ink)" }}>
          {isDark ? "Dark mode" : "Light mode"}
        </div>
        <div style={{ fontSize: 13, fontWeight: 400, color: "var(--tc-ink-muted)" }}>Tap to switch</div>
      </div>
    </button>
  );
}
