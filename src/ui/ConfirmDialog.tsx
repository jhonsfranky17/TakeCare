import { Button, type ButtonVariant } from "./Button";

interface ConfirmDialogProps {
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel?: string;
  confirmVariant?: ButtonVariant;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * A centered confirmation modal -- same overlay/rise animation as
 * AddMedicineSheet's bottom sheet, just anchored to the middle of the
 * screen instead of the bottom, since a yes/no confirmation reads more like
 * a native alert than a form. Never amber: that palette is reserved for
 * missed-dose/low-stock signals per the design's own rule, so a destructive
 * confirm (e.g. removing a medicine) uses the firm "dark" variant instead,
 * same as other deliberate-but-not-alarming actions elsewhere in the app.
 */
export function ConfirmDialog({
  title,
  message,
  confirmLabel,
  cancelLabel = "Never mind",
  confirmVariant = "dark",
  busy = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps): JSX.Element {
  return (
    <div
      role="alertdialog"
      aria-modal="true"
      aria-label={title}
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 50,
        background: "rgba(29, 50, 1, 0.34)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}
      onClick={onCancel}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 360,
          background: "var(--tc-card)",
          border: "1px solid var(--tc-line)",
          borderRadius: "var(--tc-r-card)",
          boxShadow: "var(--tc-shadow), 0 16px 32px rgba(0, 0, 0, 0.2)",
          padding: 22,
          display: "flex",
          flexDirection: "column",
          gap: 14,
          animation: "tc-rise 0.22s ease both",
        }}
      >
        <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: "-0.2px" }}>{title}</div>
        <div style={{ fontSize: 14, fontWeight: 400, lineHeight: 1.5, color: "var(--tc-ink-muted)" }}>
          {message}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 6 }}>
          <Button variant={confirmVariant} disabled={busy} onClick={onConfirm}>
            {busy ? "Working…" : confirmLabel}
          </Button>
          <Button variant="quiet" style={{ alignSelf: "center" }} disabled={busy} onClick={onCancel}>
            {cancelLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
