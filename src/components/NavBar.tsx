import type { ComponentType } from "react";
import { NavLink } from "react-router-dom";
import { FamilyIcon, HomeIcon, ClockIcon, PillIcon } from "../ui/icons";

type Tab = { to: string; end: boolean; label: string; Icon: ComponentType<{ size?: number }> };

const TABS: Tab[] = [
  { to: "/", end: true, label: "Home", Icon: HomeIcon },
  { to: "/history", end: false, label: "History", Icon: ClockIcon },
  { to: "/medicines", end: false, label: "Medicines", Icon: PillIcon },
  { to: "/family", end: false, label: "Family", Icon: FamilyIcon },
];

// Bottom tab bar — 26px bottom padding clears the iOS home indicator.
export function NavBar(): JSX.Element {
  return (
    <nav
      style={{
        flex: "none",
        background: "var(--tc-card)",
        borderTop: "1px solid var(--tc-line)",
        padding: "8px 8px 26px",
        display: "grid",
        gridTemplateColumns: "repeat(4, 1fr)",
        gap: 4,
      }}
    >
      {TABS.map(({ to, end, label, Icon }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          style={({ isActive }) => ({
            border: "none",
            cursor: "pointer",
            minHeight: 56,
            padding: "6px 0",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 5,
            borderRadius: 16,
            fontFamily: "var(--tc-font)",
            textDecoration: "none",
            background: isActive ? "var(--tc-ok-bg)" : "transparent",
            color: isActive ? "var(--tc-ok-ink)" : "var(--tc-ink-muted)",
          })}
        >
          {({ isActive }) => (
            <>
              <Icon size={23} />
              <span
                style={{
                  fontSize: "var(--tc-fs-tab)",
                  fontWeight: isActive ? 600 : 500,
                  letterSpacing: "0.1px",
                }}
              >
                {label}
              </span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
