import { useEffect, useRef, useState } from "react";
import { CheckIcon, ChevronDownIcon } from "./icons";

export interface DropdownOption {
  value: string;
  label: string;
  // Explicit `| undefined` (not just `sublabel?:`) because this repo builds
  // with exactOptionalPropertyTypes -- callers deriving this from a nullable
  // DB field (e.g. `relationship ?? undefined`) need to assign undefined
  // outright, which a bare optional property forbids.
  sublabel?: string | undefined;
}

interface DropdownProps {
  options: DropdownOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  ariaLabel: string;
  disabled?: boolean;
}

/**
 * A select-alike that actually looks like the rest of the app -- native
 * <select> popups can't be styled (card bg, rounded rows, the ok-tinted
 * selected state) the way every other list in TakeCare is. Closes on an
 * outside click, Escape, or picking an option.
 */
export function Dropdown({ options, value, onChange, placeholder, ariaLabel, disabled }: DropdownProps): JSX.Element {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const selected = options.find((o) => o.value === value);

  useEffect(() => {
    if (!open) return;

    function onPointerDown(e: PointerEvent): void {
      if (rootRef.current && e.target instanceof Node && !rootRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    function onKeyDown(e: KeyboardEvent): void {
      if (e.key === "Escape") setOpen(false);
    }

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} style={{ position: "relative" }}>
      <button
        type="button"
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        style={{
          width: "100%",
          // Matches the primary Button variant's height exactly (both read
          // --tc-h-cta) so a Dropdown sitting next to a primary Button --
          // e.g. WhoAreYou's name picker above its "That's me!" button --
          // lines up instead of looking like two different control sizes.
          height: "var(--tc-h-cta)",
          borderRadius: "var(--tc-r-button)",
          border: "1.5px solid var(--tc-line)",
          background: "var(--tc-card)",
          padding: "0 16px",
          fontFamily: "var(--tc-font)",
          fontSize: 15,
          fontWeight: 500,
          color: selected ? "var(--tc-ink)" : "var(--tc-ink-muted)",
          outline: "none",
          cursor: disabled ? "default" : "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 10,
        }}
      >
        <span
          style={{
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            textAlign: "left",
          }}
        >
          {selected ? selected.label : placeholder}
        </span>
        <span
          style={{
            flex: "none",
            display: "flex",
            color: "var(--tc-ink-muted)",
            transform: open ? "rotate(180deg)" : "none",
            transition: "transform 0.15s ease",
          }}
        >
          <ChevronDownIcon size={18} />
        </span>
      </button>

      {open && (
        <div
          role="listbox"
          aria-label={ariaLabel}
          style={{
            position: "absolute",
            top: "calc(100% + 8px)",
            left: 0,
            right: 0,
            zIndex: 30,
            background: "var(--tc-card)",
            border: "1.5px solid var(--tc-line)",
            borderRadius: 16,
            boxShadow: "var(--tc-shadow), 0 12px 28px rgba(0, 0, 0, 0.16)",
            padding: 6,
            maxHeight: 260,
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            gap: 2,
          }}
        >
          {options.map((option) => {
            const isSelected = option.value === value;
            return (
              <button
                key={option.value}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 10,
                  width: "100%",
                  minHeight: "var(--tc-tap-min)",
                  padding: "10px 12px",
                  borderRadius: 12,
                  border: "none",
                  textAlign: "left",
                  fontFamily: "var(--tc-font)",
                  cursor: "pointer",
                  background: isSelected ? "var(--tc-ok-bg)" : "transparent",
                  color: isSelected ? "var(--tc-ok-ink)" : "var(--tc-ink)",
                }}
              >
                <span style={{ display: "flex", flexDirection: "column", gap: 1, minWidth: 0 }}>
                  <span style={{ fontSize: 15, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis" }}>
                    {option.label}
                  </span>
                  {option.sublabel && (
                    <span
                      style={{
                        fontSize: 12.5,
                        fontWeight: 400,
                        color: isSelected ? "var(--tc-ok-ink)" : "var(--tc-ink-muted)",
                      }}
                    >
                      {option.sublabel}
                    </span>
                  )}
                </span>
                {isSelected && (
                  <span style={{ flex: "none", display: "flex" }}>
                    <CheckIcon size={18} />
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
