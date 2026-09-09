import { useState } from 'react';
import { Button } from '../ui/Button';

const field = {
  height: 56, borderRadius: 16, border: '1.5px solid var(--tc-line)',
  background: 'var(--tc-card)', padding: '0 16px', fontFamily: 'var(--tc-font)',
  fontSize: 16, fontWeight: 500, color: 'var(--tc-ink)', outline: 'none',
} as const;

const labelStyle = { fontSize: 13.5, fontWeight: 600, color: 'var(--tc-ink-muted)' } as const;

/** Bottom sheet used for both add and edit — pass initial values for edit. */
export function AddMedicineSheet({
  onClose,
  onSave,
}: {
  onClose: () => void;
  onSave: (values: { name: string; dosage: string; stock: string; times: string[] }) => void;
}) {
  const [name, setName] = useState('');
  const [dosage, setDosage] = useState('');
  const [stock, setStock] = useState('');
  const [times, setTimes] = useState<string[]>(['8:00 AM', '9:00 PM']);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Add a medicine"
      style={{
        position: 'absolute', inset: 0, zIndex: 40,
        background: 'rgba(29, 50, 1, 0.34)', display: 'flex', alignItems: 'flex-end',
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%', background: 'var(--tc-bg)', borderRadius: '28px 28px 0 0',
          padding: '22px 20px 34px', display: 'flex', flexDirection: 'column', gap: 16,
          maxHeight: '88%', overflowY: 'auto', animation: 'tc-rise 0.28s ease both',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ fontSize: 21, fontWeight: 700, letterSpacing: '-0.3px' }}>Add a medicine</div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            style={{
              width: 44, height: 44, border: 'none', borderRadius: 14,
              background: 'var(--tc-pill)', color: 'var(--tc-ink-muted)',
              fontSize: 20, fontFamily: 'var(--tc-font)', cursor: 'pointer',
            }}
          >
            ×
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
          <label htmlFor="tc-name" style={labelStyle}>Medicine name</label>
          <input id="tc-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Aspirin" style={field} />
        </div>

        <div style={{ display: 'flex', gap: 12 }}>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 7 }}>
            <label htmlFor="tc-dosage" style={labelStyle}>Dosage</label>
            <input id="tc-dosage" value={dosage} onChange={(e) => setDosage(e.target.value)} placeholder="75 mg" style={field} />
          </div>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 7 }}>
            <label htmlFor="tc-stock" style={labelStyle}>Pills in hand</label>
            <input id="tc-stock" inputMode="numeric" value={stock} onChange={(e) => setStock(e.target.value)} placeholder="30" style={field} />
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
          <span style={labelStyle}>When should Dad take it?</span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 9 }}>
            {times.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTimes(times.filter((x) => x !== t))}
                style={{
                  padding: '12px 16px', borderRadius: 14, minHeight: 'var(--tc-tap-min)',
                  background: 'var(--tc-ok-bg)', border: '1.5px solid var(--tc-ok-line)',
                  fontFamily: 'var(--tc-font)', fontSize: 15, fontWeight: 600,
                  color: 'var(--tc-ok-ink)', cursor: 'pointer',
                }}
              >
                {t} ×
              </button>
            ))}
            <button
              type="button"
              style={{
                padding: '12px 16px', borderRadius: 14, minHeight: 'var(--tc-tap-min)',
                background: 'var(--tc-card)', border: '1.5px dashed var(--tc-line)',
                fontFamily: 'var(--tc-font)', fontSize: 15, fontWeight: 500,
                color: 'var(--tc-ink-muted)', cursor: 'pointer',
              }}
            >
              + Add time
            </button>
          </div>
        </div>

        <Button
          variant="primary"
          style={{ height: 60, fontSize: 18, fontWeight: 600, marginTop: 4 }}
          onClick={() => onSave({ name, dosage, stock, times })}
        >
          Save medicine
        </Button>
      </div>
    </div>
  );
}
