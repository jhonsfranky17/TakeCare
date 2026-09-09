import type { ViewMedicine as Medicine } from './viewTypes';
import { InfoIcon } from './icons';

export function StockBar({ medicine }: { medicine: Medicine }) {
  const pct = Math.max(4, Math.round((medicine.stockCount / medicine.stockCapacity) * 100));
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
        <div
          style={{
            fontSize: 13.5, fontWeight: 500,
            color: medicine.low ? 'var(--tc-warn-ink)' : 'var(--tc-ink)',
          }}
        >
          {medicine.stockCount} tablets left
        </div>
        <div style={{ fontSize: 13, fontWeight: 400, color: 'var(--tc-ink-muted)' }}>
          {medicine.runsOut}
        </div>
      </div>
      <div style={{ height: 10, borderRadius: 'var(--tc-r-badge)', background: 'var(--tc-pill)', overflow: 'hidden' }}>
        <div
          style={{
            height: '100%', width: pct + '%', borderRadius: 'var(--tc-r-badge)',
            background: medicine.low ? 'var(--tc-warn-fill)' : 'var(--lima-500)',
          }}
        />
      </div>
    </div>
  );
}

/** Low stock is a nudge, not an alarm — amber, plain language, no exclamation marks. */
export function LowStockNudge({ recipient = 'Priya' }: { recipient?: string }) {
  return (
    <div
      style={{
        display: 'flex', alignItems: 'center', gap: 11,
        background: 'var(--tc-warn-bg)', border: '1px solid var(--tc-warn-line)',
        borderRadius: 16, padding: '13px 14px', color: 'var(--tc-warn-ink)',
      }}
    >
      <InfoIcon size={20} style={{ flex: 'none' }} />
      <div style={{ fontSize: 13.5, fontWeight: 500, lineHeight: 1.45 }}>
        Time to pick up a refill this week. We&rsquo;ll remind {recipient} too.
      </div>
    </div>
  );
}
