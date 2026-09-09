import type { Medicine } from '../data/types';
import { LowStockNudge, StockBar } from '../ui/StockBar';
import { PillIcon } from '../ui/icons';

export function MedicinesScreen({
  medicines,
  onAdd,
  onEdit,
}: {
  medicines: Medicine[];
  onAdd: () => void;
  onEdit: (id: string) => void;
}) {
  const lowCount = medicines.filter((m) => m.low).length;

  return (
    <div style={{ padding: '62px 20px 24px', display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          <div style={{ fontSize: 'var(--tc-fs-title)', fontWeight: 700, letterSpacing: '-0.5px' }}>Medicines</div>
          <div style={{ fontSize: 'var(--tc-fs-body)', fontWeight: 400, color: 'var(--tc-ink-muted)' }}>
            {medicines.length} medicines · {lowCount} need a refill soon
          </div>
        </div>
        <button
          type="button"
          onClick={onAdd}
          aria-label="Add a medicine"
          style={{
            width: 48, height: 48, flex: 'none', border: 'none', borderRadius: 16,
            background: 'var(--tc-cta)', color: 'var(--tc-cta-ink)',
            fontSize: 26, fontWeight: 600, fontFamily: 'var(--tc-font)', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1, paddingBottom: 4,
          }}
        >
          +
        </button>
      </div>

      {medicines.map((m) => (
        <div
          key={m.id}
          style={{
            background: 'var(--tc-card)', border: '1px solid var(--tc-line)',
            borderRadius: 'var(--tc-r-card)', padding: 18,
            display: 'flex', flexDirection: 'column', gap: 14, boxShadow: 'var(--tc-shadow)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
            <div
              style={{
                width: 44, height: 44, borderRadius: 14, background: 'var(--tc-pill)',
                flex: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'var(--tc-ok-ink)',
              }}
            >
              <PillIcon size={22} />
            </div>
            <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div style={{ fontSize: 18, fontWeight: 600, letterSpacing: '-0.2px' }}>{m.name}</div>
              <div style={{ fontSize: 14, fontWeight: 400, color: 'var(--tc-ink-muted)' }}>
                {m.dosage} · {m.schedule}
              </div>
            </div>
            <button
              type="button"
              onClick={() => onEdit(m.id)}
              style={{
                border: 'none', background: 'transparent', color: 'var(--tc-ink-muted)',
                fontFamily: 'var(--tc-font)', fontSize: 14, fontWeight: 600, cursor: 'pointer',
                minHeight: 'var(--tc-tap-min)', minWidth: 'var(--tc-tap-min)', textDecoration: 'underline',
              }}
            >
              Edit
            </button>
          </div>
          <StockBar medicine={m} />
          {m.low && <LowStockNudge />}
        </div>
      ))}
    </div>
  );
}
