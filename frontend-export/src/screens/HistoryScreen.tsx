import { useState } from 'react';
import type { HistoryDay } from '../data/types';
import { CheckIcon, ClockIcon } from '../ui/icons';

const RANGES = ['This week', 'This month', 'All'] as const;

export function HistoryScreen({ days, headline }: { days: HistoryDay[]; headline: string }) {
  const [range, setRange] = useState<string>(RANGES[0]);

  return (
    <div style={{ padding: '62px 20px 24px', display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
        <div style={{ fontSize: 'var(--tc-fs-title)', fontWeight: 700, letterSpacing: '-0.5px' }}>History</div>
        <div style={{ fontSize: 'var(--tc-fs-body)', fontWeight: 400, color: 'var(--tc-ink-muted)' }}>{headline}</div>
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        {RANGES.map((r) => {
          const on = r === range;
          return (
            <button
              key={r}
              type="button"
              onClick={() => setRange(r)}
              style={{
                border: 'none', cursor: 'pointer', fontFamily: 'var(--tc-font)',
                padding: '9px 15px', borderRadius: 'var(--tc-r-badge)',
                background: on ? 'var(--lima-950)' : 'var(--tc-pill)',
                color: on ? 'var(--lima-100)' : 'var(--tc-ink-muted)',
                fontSize: 13.5, fontWeight: on ? 600 : 500,
              }}
            >
              {r}
            </button>
          );
        })}
      </div>

      {days.map((day) => (
        <div key={day.id} style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
            <div style={{ fontSize: 15, fontWeight: 600 }}>{day.label}</div>
            <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--tc-ink-muted)' }}>{day.summary}</div>
          </div>
          <div
            style={{
              background: 'var(--tc-card)', border: '1px solid var(--tc-line)',
              borderRadius: 20, overflow: 'hidden', boxShadow: 'var(--tc-shadow)',
            }}
          >
            {day.rows.map((row) => (
              <div
                key={row.id}
                style={{
                  display: 'flex', alignItems: 'center', gap: 13, padding: '15px 16px',
                  borderBottom: '1px solid var(--tc-line)', minHeight: 56,
                }}
              >
                <div
                  style={{
                    width: 34, height: 34, borderRadius: 11, flex: 'none',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: row.taken ? 'var(--tc-ok-bg)' : 'var(--tc-warn-bg)',
                    color: row.taken ? 'var(--tc-ok-ink)' : 'var(--tc-warn-ink)',
                  }}
                >
                  {row.taken ? <CheckIcon size={17} /> : <ClockIcon size={17} />}
                </div>
                <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <div
                    style={{
                      fontSize: 15.5, fontWeight: 600, whiteSpace: 'nowrap',
                      overflow: 'hidden', textOverflow: 'ellipsis',
                    }}
                  >
                    {row.name}
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 400, color: 'var(--tc-ink-muted)' }}>{row.detail}</div>
                </div>
                <div
                  style={{
                    fontSize: 'var(--tc-fs-badge)', fontWeight: 600, letterSpacing: '0.2px',
                    padding: '6px 10px', borderRadius: 'var(--tc-r-badge)', flex: 'none',
                    background: row.taken ? 'var(--tc-ok-bg)' : 'var(--tc-warn-bg)',
                    color: row.taken ? 'var(--tc-ok-ink)' : 'var(--tc-warn-ink)',
                  }}
                >
                  {row.status}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
