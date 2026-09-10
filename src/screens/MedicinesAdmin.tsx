import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { daysRemaining, joinNames, joinTimes, runsOutLabel, timeOfDayFromHHMM, to12h } from "../lib/format";
import { LowStockNudge, StockBar } from "../ui/StockBar";
import { PillIcon } from "../ui/icons";
import { AddMedicineSheet } from "./AddMedicineSheet";
import { LoadingScreen } from "../components/LoadingScreen";
import { TimeFilterBar, timeFilterMatches, type TimeFilterLabel } from "../components/TimeFilterBar";
import type { Medicine } from "../lib/types";
import type { ViewMedicine } from "../ui/viewTypes";

const PAGE_SIZE = 5;

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
    notes: m.notes,
  };
}

export function MedicinesAdmin(): JSX.Element {
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [otherNames, setOtherNames] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [sheetFor, setSheetFor] = useState<Medicine | "new" | null>(null);
  const [query, setQuery] = useState<string>("");
  const [timeFilter, setTimeFilter] = useState<TimeFilterLabel>("All");
  const [page, setPage] = useState<number>(0);

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
      .not("auth_user_id", "is", null)
      .then(({ data }) => setOtherNames((data ?? []).map((m) => m.name)));
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return medicines.filter((m) => {
      if (q && !m.name.toLowerCase().includes(q)) return false;
      // A medicine can have several times a day -- it matches a time-of-day
      // filter if any one of them falls in that band, not only its first.
      if (timeFilter !== "All" && !m.times_per_day.some((t) => timeFilterMatches(timeOfDayFromHHMM(t), timeFilter))) {
        return false;
      }
      return true;
    });
  }, [medicines, query, timeFilter]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const clampedPage = Math.min(page, pageCount - 1);
  const paged = filtered.slice(clampedPage * PAGE_SIZE, clampedPage * PAGE_SIZE + PAGE_SIZE);
  const viewMedicines = paged.map(toViewMedicine);
  const lowCount = medicines.filter((m) => {
    const remaining = daysRemaining(m.current_stock, m.dosage_per_intake, m.times_per_day.length);
    return remaining <= m.refill_threshold_days;
  }).length;
  const recipient = joinNames(otherNames) || "the family";

  if (loading) {
    return <LoadingScreen />;
  }

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

      {medicines.length > PAGE_SIZE && (
        <input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setPage(0);
          }}
          placeholder="Search medicines…"
          aria-label="Search medicines"
          style={{
            height: 48,
            borderRadius: 16,
            border: "1.5px solid var(--tc-line)",
            background: "var(--tc-card)",
            padding: "0 16px",
            fontFamily: "var(--tc-font)",
            fontSize: 15,
            fontWeight: 500,
            color: "var(--tc-ink)",
            outline: "none",
          }}
        />
      )}

      {medicines.length > 0 && (
        <TimeFilterBar
          value={timeFilter}
          onChange={(f) => {
            setTimeFilter(f);
            setPage(0);
          }}
        />
      )}

      {error && <div style={{ fontSize: 13.5, color: "var(--tc-warn-ink)" }}>{error}</div>}

      {filtered.length === 0 ? (
        <div style={{ fontSize: 14.5, color: "var(--tc-ink-muted)" }}>
          {medicines.length === 0
            ? "No medicines added yet."
            : query.trim()
              ? `No medicines match “${query}”${timeFilter === "All" ? "" : ` in the ${timeFilter.toLowerCase()}`}.`
              : `No medicines in the ${timeFilter.toLowerCase()}.`}
        </div>
      ) : (
        paged.map((medicine, i) => {
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
                  {view.notes && (
                    <div style={{ fontSize: 13, fontWeight: 400, fontStyle: "italic", color: "var(--tc-ink-muted)" }}>
                      {view.notes}
                    </div>
                  )}
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
        })
      )}

      {pageCount > 1 && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 14, marginTop: 4 }}>
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={clampedPage === 0}
            style={{
              minHeight: "var(--tc-tap-min)",
              minWidth: "var(--tc-tap-min)",
              border: "none",
              borderRadius: "var(--tc-r-badge)",
              background: "var(--tc-pill)",
              color: clampedPage === 0 ? "var(--tc-line)" : "var(--tc-ink-muted)",
              fontFamily: "var(--tc-font)",
              fontSize: 14,
              fontWeight: 600,
              cursor: clampedPage === 0 ? "default" : "pointer",
            }}
          >
            Prev
          </button>
          <span style={{ fontSize: 13.5, fontWeight: 500, color: "var(--tc-ink-muted)" }}>
            Page {clampedPage + 1} of {pageCount}
          </span>
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
            disabled={clampedPage >= pageCount - 1}
            style={{
              minHeight: "var(--tc-tap-min)",
              minWidth: "var(--tc-tap-min)",
              border: "none",
              borderRadius: "var(--tc-r-badge)",
              background: "var(--tc-pill)",
              color: clampedPage >= pageCount - 1 ? "var(--tc-line)" : "var(--tc-ink-muted)",
              fontFamily: "var(--tc-font)",
              fontSize: 14,
              fontWeight: 600,
              cursor: clampedPage >= pageCount - 1 ? "default" : "pointer",
            }}
          >
            Next
          </button>
        </div>
      )}

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
