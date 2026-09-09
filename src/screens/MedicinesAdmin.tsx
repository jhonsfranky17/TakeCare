import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { daysRemaining, joinNames, joinTimes, runsOutLabel, to12h } from "../lib/format";
import { LowStockNudge, StockBar } from "../ui/StockBar";
import { PillIcon } from "../ui/icons";
import { AddMedicineSheet } from "./AddMedicineSheet";
import { LoadingScreen } from "../components/LoadingScreen";
import type { Medicine } from "../lib/types";
import type { ViewMedicine } from "../ui/viewTypes";

function toViewMedicine(m: Medicine): ViewMedicine {
  const remaining = daysRemaining(m.current_stock, m.dosage_per_intake, m.times_per_day.length);
  const low = remaining <= m.refill_threshold_days;
  const dailyDoses = m.dosage_per_intake * m.times_per_day.length;
  return {
    id: m.id,
    name: m.name,
    dosage: `${m.dosage_per_intake} pill${m.dosage_per_intake === 1 ? "" : "s"}`,
    schedule: joinTimes(m.times_per_day.map(to12h)),
    stockCount: m.current_stock,
    stockCapacity: Math.max(m.refill_threshold_days * dailyDoses * 3, m.current_stock, 1),
    runsOut: runsOutLabel(remaining),
    low,
  };
}

export function MedicinesAdmin(): JSX.Element {
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [otherNames, setOtherNames] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [sheetFor, setSheetFor] = useState<Medicine | "new" | null>(null);

  const loadMedicines = async (): Promise<void> => {
    const { data, error: fetchError } = await supabase
      .from("medicines")
      .select("*")
      .order("created_at", { ascending: true });

    if (fetchError) {
      setError(fetchError.message);
    } else {
      setMedicines(data ?? []);
    }
    setLoading(false);
  };

  useEffect(() => {
    void loadMedicines();
    supabase
      .from("family_members")
      .select("name")
      .then(({ data }) => setOtherNames((data ?? []).map((m) => m.name)));
  }, []);

  if (loading) {
    return <LoadingScreen />;
  }

  const viewMedicines = medicines.map(toViewMedicine);
  const lowCount = viewMedicines.filter((m) => m.low).length;
  const recipient = joinNames(otherNames) || "the family";

  return (
    <div style={{ padding: "62px 20px 24px", display: "flex", flexDirection: "column", gap: 18 }}>
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 12 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
          <div style={{ fontSize: "var(--tc-fs-title)", fontWeight: 700, letterSpacing: "-0.5px" }}>Medicines</div>
          <div style={{ fontSize: "var(--tc-fs-body)", fontWeight: 400, color: "var(--tc-ink-muted)" }}>
            {medicines.length} medicine{medicines.length === 1 ? "" : "s"} · {lowCount} need a refill soon
          </div>
        </div>
        <button
          type="button"
          onClick={() => setSheetFor("new")}
          aria-label="Add a medicine"
          style={{
            width: 48,
            height: 48,
            flex: "none",
            border: "none",
            borderRadius: 16,
            background: "var(--tc-cta)",
            color: "var(--tc-cta-ink)",
            fontSize: 26,
            fontWeight: 600,
            fontFamily: "var(--tc-font)",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            lineHeight: 1,
            paddingBottom: 4,
          }}
        >
          +
        </button>
      </div>

      {error && <div style={{ fontSize: 13.5, color: "var(--tc-warn-ink)" }}>{error}</div>}

      {medicines.map((medicine, i) => {
        const view = viewMedicines[i];
        if (!view) return null;
        return (
          <div
            key={medicine.id}
            style={{
              background: "var(--tc-card)",
              border: "1px solid var(--tc-line)",
              borderRadius: "var(--tc-r-card)",
              padding: 18,
              display: "flex",
              flexDirection: "column",
              gap: 14,
              boxShadow: "var(--tc-shadow)",
            }}
          >
            <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 14,
                  background: "var(--tc-pill)",
                  flex: "none",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--tc-ok-ink)",
                }}
              >
                <PillIcon size={22} />
              </div>
              <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 4 }}>
                <div style={{ fontSize: 18, fontWeight: 600, letterSpacing: "-0.2px" }}>{view.name}</div>
                <div style={{ fontSize: 14, fontWeight: 400, color: "var(--tc-ink-muted)" }}>
                  {view.dosage} · {view.schedule}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSheetFor(medicine)}
                style={{
                  border: "none",
                  background: "transparent",
                  color: "var(--tc-ink-muted)",
                  fontFamily: "var(--tc-font)",
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: "pointer",
                  minHeight: "var(--tc-tap-min)",
                  minWidth: "var(--tc-tap-min)",
                  textDecoration: "underline",
                }}
              >
                Edit
              </button>
            </div>
            <StockBar medicine={view} />
            {view.low && <LowStockNudge recipient={recipient} />}
          </div>
        );
      })}

      {sheetFor && (
        <AddMedicineSheet
          editing={sheetFor === "new" ? null : sheetFor}
          onClose={() => setSheetFor(null)}
          onSaved={() => {
            setSheetFor(null);
            void loadMedicines();
          }}
        />
      )}
    </div>
  );
}
