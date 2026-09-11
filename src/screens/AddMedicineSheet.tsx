import { useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../lib/AuthContext";
import { sortTimes12h, to12h, to24h } from "../lib/format";
import { Button } from "../ui/Button";
import { ConfirmDialog } from "../ui/ConfirmDialog";
import type { Medicine } from "../lib/types";

const field = {
  height: 56,
  borderRadius: 16,
  border: "1.5px solid var(--tc-line)",
  background: "var(--tc-card)",
  padding: "0 16px",
  fontFamily: "var(--tc-font)",
  fontSize: 16,
  fontWeight: 500,
  color: "var(--tc-ink)",
  outline: "none",
} as const;

const labelStyle = {
  fontSize: 13.5,
  fontWeight: 600,
  color: "var(--tc-ink-muted)",
} as const;

interface AddMedicineSheetProps {
  editing: Medicine | null;
  onClose: () => void;
  onSaved: () => void;
}

/** Bottom sheet used for both add and edit — pass `editing` for edit. */
export function AddMedicineSheet({
  editing,
  onClose,
  onSaved,
}: AddMedicineSheetProps): JSX.Element {
  const { patient } = useAuth();
  const [name, setName] = useState(editing?.name ?? "");
  const [dosage, setDosage] = useState(
    editing ? String(editing.dosage_per_intake) : "1",
  );
  const [stock, setStock] = useState(
    editing ? String(editing.current_stock) : "",
  );
  const [times, setTimes] = useState<string[]>(
    // Sorted on load too -- a medicine saved before this fix (or with times
    // ever stored out of order some other way) should still display in
    // order the first time this sheet opens for it, not just after the next
    // edit.
    sortTimes12h(editing ? editing.times_per_day.map(to12h) : ["8:00 AM", "9:00 PM"]),
  );
  const [notes, setNotes] = useState(editing?.notes ?? "");
  const [addingTime, setAddingTime] = useState(false);
  const [saving, setSaving] = useState(false);
  const [confirmingRemove, setConfirmingRemove] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async (): Promise<void> => {
    if (!patient || !name.trim() || times.length === 0) return;
    const times24h = times.map(to24h).filter((t): t is string => t !== null);

    setSaving(true);
    setError(null);

    const dosagePerIntake = Number(dosage) || 1;
    const currentStock = Number(stock) || 0;
    const trimmedNotes = notes.trim();

    const { error: saveError } = editing
      ? await supabase
          .from("medicines")
          .update({
            name: name.trim(),
            dosage_per_intake: dosagePerIntake,
            current_stock: currentStock,
            times_per_day: times24h,
            notes: trimmedNotes || null,
            // Topping stock back above the refill threshold resets the alert
            // flag so a future dip below it fires again (build spec 9.3).
            low_stock_alert_sent_at:
              currentStock / (dosagePerIntake * times24h.length) >
              editing.refill_threshold_days
                ? null
                : editing.low_stock_alert_sent_at,
          })
          .eq("id", editing.id)
      : await supabase.from("medicines").insert({
          name: name.trim(),
          dosage_per_intake: dosagePerIntake,
          current_stock: currentStock,
          times_per_day: times24h,
          notes: trimmedNotes || null,
          patient_id: patient.id,
          refill_threshold_days: 3,
        });

    setSaving(false);
    if (saveError) {
      setError(saveError.message);
      return;
    }
    onSaved();
  };

  const handleRemove = async (): Promise<void> => {
    if (!editing) return;
    setSaving(true);
    const { error: deleteError } = await supabase
      .from("medicines")
      .delete()
      .eq("id", editing.id);
    setSaving(false);
    if (deleteError) {
      setError(deleteError.message);
      return;
    }
    onSaved();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={editing ? "Edit medicine" : "Add a medicine"}
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 40,
        background: "rgba(29, 50, 1, 0.34)",
        display: "flex",
        alignItems: "flex-end",
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          background: "var(--tc-bg)",
          borderRadius: "28px 28px 0 0",
          padding: "22px 20px 34px",
          display: "flex",
          flexDirection: "column",
          gap: 16,
          maxHeight: "88%",
          overflowY: "auto",
          animation: "tc-rise 0.28s ease both",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
          }}
        >
          <div
            style={{ fontSize: 21, fontWeight: 700, letterSpacing: "-0.3px" }}
          >
            {editing ? "Edit medicine" : "Add a medicine"}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            style={{
              width: 44,
              height: 44,
              border: "none",
              borderRadius: 14,
              background: "var(--tc-pill)",
              color: "var(--tc-ink-muted)",
              fontSize: 20,
              fontFamily: "var(--tc-font)",
              cursor: "pointer",
            }}
          >
            ×
          </button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
          <label htmlFor="tc-name" style={labelStyle}>
            Medicine name
          </label>
          <input
            id="tc-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Aspirin"
            style={field}
          />
        </div>

        <div style={{ display: "flex", gap: 12 }}>
          <div
            style={{
              flex: 1,
              minWidth: 0,
              display: "flex",
              flexDirection: "column",
              gap: 7,
            }}
          >
            <label htmlFor="tc-dosage" style={labelStyle}>
              Pills per dose
            </label>
            <input
              id="tc-dosage"
              type="number"
              min={1}
              inputMode="numeric"
              value={dosage}
              onChange={(e) => setDosage(e.target.value)}
              placeholder="1"
              style={{ ...field, width: "100%" }}
            />
          </div>
          <div
            style={{
              flex: 1,
              minWidth: 0,
              display: "flex",
              flexDirection: "column",
              gap: 7,
            }}
          >
            <label htmlFor="tc-stock" style={labelStyle}>
              Pills in hand
            </label>
            <input
              id="tc-stock"
              type="number"
              min={0}
              inputMode="numeric"
              value={stock}
              onChange={(e) => setStock(e.target.value)}
              placeholder="30"
              style={{ ...field, width: "100%" }}
            />
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
          <span style={labelStyle}>When should they take it?</span>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 9 }}>
            {times.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTimes(times.filter((x) => x !== t))}
                style={{
                  padding: "12px 16px",
                  borderRadius: 14,
                  minHeight: "var(--tc-tap-min)",
                  background: "var(--tc-ok-bg)",
                  border: "1.5px solid var(--tc-ok-line)",
                  fontFamily: "var(--tc-font)",
                  fontSize: 15,
                  fontWeight: 600,
                  color: "var(--tc-ok-ink)",
                  cursor: "pointer",
                }}
              >
                {t} ×
              </button>
            ))}
            {addingTime ? (
              <input
                type="time"
                autoFocus
                onChange={(e) => {
                  if (!e.target.value) return;
                  const [h, m] = e.target.value.split(":");
                  const hour = Number(h);
                  const period = hour >= 12 ? "PM" : "AM";
                  const hour12 = hour % 12 === 0 ? 12 : hour % 12;
                  const display = `${hour12}:${m} ${period}`;
                  setTimes((prev) =>
                    prev.includes(display) ? prev : sortTimes12h([...prev, display]),
                  );
                  setAddingTime(false);
                }}
                onBlur={() => setAddingTime(false)}
                style={{ ...field, height: "var(--tc-tap-min)", width: 140 }}
              />
            ) : (
              <button
                type="button"
                onClick={() => setAddingTime(true)}
                style={{
                  padding: "12px 16px",
                  borderRadius: 14,
                  minHeight: "var(--tc-tap-min)",
                  background: "var(--tc-card)",
                  border: "1.5px dashed var(--tc-line)",
                  fontFamily: "var(--tc-font)",
                  fontSize: 15,
                  fontWeight: 500,
                  color: "var(--tc-ink-muted)",
                  cursor: "pointer",
                }}
              >
                + Add time
              </button>
            )}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
          <label htmlFor="tc-notes" style={labelStyle}>
            Notes (optional)
          </label>
          <textarea
            id="tc-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Take with food, the small white one"
            rows={2}
            style={{
              ...field,
              height: "auto",
              minHeight: 64,
              padding: "14px 16px",
              resize: "vertical",
              fontFamily: "var(--tc-font)",
            }}
          />
        </div>

        {error && (
          <div style={{ fontSize: 13.5, color: "var(--tc-warn-ink)" }}>
            {error}
          </div>
        )}

        <Button
          variant="primary"
          style={{ marginTop: 4 }}
          disabled={saving || !name.trim() || times.length === 0}
          onClick={() => void handleSave()}
        >
          {saving ? "Saving…" : "Save medicine"}
        </Button>

        {editing && (
          <Button
            variant="quiet"
            style={{ alignSelf: "center" }}
            disabled={saving}
            onClick={() => setConfirmingRemove(true)}
          >
            Remove medicine
          </Button>
        )}
      </div>

      {confirmingRemove && editing && (
        <ConfirmDialog
          title={`Remove ${editing.name}?`}
          message="This can't be undone -- it stops future doses being scheduled and clears its history too."
          confirmLabel="Yes, remove it"
          busy={saving}
          onConfirm={() => void handleRemove()}
          onCancel={() => setConfirmingRemove(false)}
        />
      )}
    </div>
  );
}
