import type { ButtonHTMLAttributes, CSSProperties, ReactNode } from "react";
import { useState } from "react";

export type ButtonVariant = "primary" | "recovery" | "dark" | "quiet";

const base: CSSProperties = {
  fontFamily: "var(--tc-font)",
  border: "none",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 10,
  width: "100%",
};

const variants: Record<ButtonVariant, CSSProperties> = {
  // The single most important control in the app: still the tallest and
  // loudest, just not oversized -- 56px keeps it well above the 48px
  // tap-target floor every interactive element in this app respects.
  primary: {
    height: "var(--tc-h-cta)",
    borderRadius: "var(--tc-r-button)",
    background: "var(--tc-cta)",
    color: "var(--tc-cta-ink)",
    fontSize: 15,
    fontWeight: 700,
    letterSpacing: "-0.1px",
    boxShadow: "0 6px 16px rgba(149, 220, 6, 0.34)",
  },
  recovery: {
    height: "var(--tc-h-button)",
    borderRadius: 16,
    background: "transparent",
    border: "1.5px solid var(--tc-warn-line)",
    color: "var(--tc-warn-ink)",
    fontSize: 15,
    fontWeight: 600,
  },
  dark: {
    height: "var(--tc-h-button)",
    borderRadius: 16,
    background: "var(--lima-950)",
    color: "var(--lima-100)",
    fontSize: 15,
    fontWeight: 600,
    padding: "0 20px",
    width: "auto",
  },
  quiet: {
    minHeight: "var(--tc-tap-min)",
    background: "transparent",
    color: "var(--tc-ink-muted)",
    fontSize: 14,
    fontWeight: 600,
    textDecoration: "underline",
    width: "auto",
    padding: "8px 4px",
  },
};

const pressed: Record<ButtonVariant, CSSProperties> = {
  primary: {
    background: "var(--tc-cta-pressed)",
    color: "#FFFFFF",
    boxShadow: "none",
  },
  recovery: { background: "var(--tc-warn-line)" },
  dark: { background: "var(--lima-900)" },
  quiet: { color: "var(--tc-ink)" },
};

export function Button({
  variant = "primary",
  children,
  style,
  ...rest
}: {
  variant?: ButtonVariant;
  children: ReactNode;
} & ButtonHTMLAttributes<HTMLButtonElement>) {
  const [down, setDown] = useState(false);
  return (
    <button
      type="button"
      onPointerDown={() => setDown(true)}
      onPointerUp={() => setDown(false)}
      onPointerLeave={() => setDown(false)}
      style={{
        ...base,
        ...variants[variant],
        ...(down ? pressed[variant] : null),
        ...style,
      }}
      {...rest}
    >
      {children}
    </button>
  );
}
