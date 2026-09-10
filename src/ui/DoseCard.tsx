import { useState, type CSSProperties } from "react";
import type { Dose, DoseStatus } from "./viewTypes";
import { Button } from "./Button";
import { StatusBadge } from "./StatusBadge";
import { ConfirmDialog } from "./ConfirmDialog";
import { CheckIcon, ClockIcon } from "./icons";

const surface: Record<DoseStatus, CSSProperties> = {
  pending: {
    background: "var(--tc-card)",
    borderColor: "var(--tc-line)",
    boxShadow: "var(--tc-shadow)",
  },
  taken: { background: "var(--tc-ok-bg)", borderColor: "var(--tc-ok-line)" },
  missed: {
    background: "var(--tc-warn-bg)",
    borderColor: "var(--tc-warn-line)",
  },
};

const iconTint: Record<DoseStatus, string> = {
  pending: "var(--lima-700)",
  taken: "var(--tc-ok-ink)",
  missed: "var(--tc-warn-ink)",
};

export function DoseCard({
  dose,
  marking = false,
  onMarkTaken,
  onUndo,
}: {
  dose: Dose;
  // True while this specific dose's mark-taken/log-it-anyway request is in
  // flight -- disables the button and swaps its label so a slow connection
  // doesn't look like the tap did nothing.
  marking?: boolean;
  onMarkTaken: (id: string) => void;
  // Returns a Promise (not fire-and-forget) so the confirm dialog below can
  // show its own busy state for the duration of the undo request.
  onUndo: (id: string) => Promise<void>;
}) {
  const [confirmingUndo, setConfirmingUndo] = useState(false);
  const [undoing, setUndoing] = useState(false);

  const card: CSSProperties = {
    borderRadius: 24,
    padding: 18,
    display: "flex",
    flexDirection: "column",
    gap: 14,
    borderWidth: 1.5,
    borderStyle: "solid",
    ...surface[dose.status],
  };
  const iconBox: CSSProperties = {
    width: 48,
    height: 48,
    borderRadius: 16,
    flex: "none",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background:
      dose.status === "pending" ? "var(--tc-pill)" : "rgba(255, 255, 255, 0.6)",
    color: iconTint[dose.status],
  };

  const handleConfirmUndo = async (): Promise<void> => {
    setUndoing(true);
    await onUndo(dose.id);
    // No `finally`-style reset needed: a successful undo flips dose.status
    // away from "taken" via the parent's refetch, which unmounts this
    // branch (and the dialog with it) entirely.
  };

  return (
    <div style={card}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
        <div style={iconBox}>
          {dose.status === "taken" ? (
            <CheckIcon size={24} />
          ) : (
            <ClockIcon size={24} />
          )}
        </div>
        <div
          style={{
            flex: 1,
            minWidth: 0,
            display: "flex",
            flexDirection: "column",
            gap: 3,
          }}
        >
          <div
            style={{
              fontSize: "var(--tc-fs-card)",
              fontWeight: 600,
              letterSpacing: "-0.2px",
            }}
          >
            {dose.medicineName}
          </div>
          <div
            style={{
              fontSize: "var(--tc-fs-body)",
              fontWeight: 400,
              color: "var(--tc-ink-muted)",
            }}
          >
            {dose.dosage} · {dose.scheduledTime}
          </div>
          {dose.notes && (
            <div
              style={{
                fontSize: 13,
                fontWeight: 400,
                fontStyle: "italic",
                color: "var(--tc-ink-muted)",
              }}
            >
              {dose.notes}
            </div>
          )}
        </div>
        <StatusBadge
          status={dose.status}
          dueLabel={"Due " + dose.scheduledTime.replace(":00", "")}
        />
      </div>

      {dose.status === "pending" && (
        // minHeight/centered wrapper, not just the button -- lines this
        // row's total height up with taken's action row exactly (both end
        // up var(--tc-tap-min) tall), since Undo's own tap-target floor
        // already puts taken at that height and pending's 40px button alone
        // would otherwise sit a few px shorter.
        <div style={{ minHeight: "var(--tc-tap-min)", display: "flex", alignItems: "center" }}>
          <Button variant="primary" disabled={marking} onClick={() => onMarkTaken(dose.id)}>
            <CheckIcon size={20} />
            {marking ? "Logging…" : "Mark as Taken"}
          </Button>
        </div>
      )}

      {dose.status === "taken" && (
        // No border-top/padding-top divider (the approved design had one) --
        // box-sizing:border-box means that 13px was added on top of Undo's
        // already-48px tap-target floor, pushing this row past pending's
        // height with nothing to trim. The card's own 14px gap above this
        // row provides the same visual separation the divider did.
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 10,
            minHeight: "var(--tc-tap-min)",
          }}
        >
          <div
            style={{ fontSize: 14, fontWeight: 500, color: "var(--tc-ok-ink)" }}
          >
            {dose.takenAt === "just now"
              ? "Marked as taken just now"
              : "Taken at " + dose.takenAt}
          </div>
          <Button variant="quiet" onClick={() => setConfirmingUndo(true)}>
            Undo
          </Button>
        </div>
      )}

      {dose.status === "missed" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div
            style={{
              fontSize: 14,
              fontWeight: 400,
              lineHeight: 1.5,
              color: "var(--tc-warn-ink)",
            }}
          >
            This one slipped by. No harm done — you can still log it, or skip it
            if you&rsquo;d rather.
          </div>
          <Button variant="recovery" disabled={marking} onClick={() => onMarkTaken(dose.id)}>
            {marking ? "Logging…" : "Log it now anyway"}
          </Button>
        </div>
      )}

      {confirmingUndo && (
        <ConfirmDialog
          title="Undo this dose?"
          message={`This puts ${dose.medicineName} back to pending -- you can mark it taken again anytime.`}
          confirmLabel="Yes, undo"
          busy={undoing}
          onConfirm={() => void handleConfirmUndo()}
          onCancel={() => setConfirmingUndo(false)}
        />
      )}
    </div>
  );
}
