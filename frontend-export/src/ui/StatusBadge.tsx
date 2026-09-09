import type { CSSProperties } from 'react';
import type { DoseStatus } from '../data/types';
import { CheckIcon, ClockIcon } from './icons';

/**
 * Status is carried by icon + word + weight first, colour second — the patient may have
 * reduced colour perception, so a badge must never rely on hue alone.
 */
export function StatusBadge({ status, dueLabel }: { status: DoseStatus; dueLabel?: string }) {
  const glass = 'rgba(255, 255, 255, 0.6)';
  const map: Record<DoseStatus, { label: string; bg: string; color: string }> = {
    pending: { label: dueLabel ?? 'Pending', bg: 'var(--tc-pill)', color: 'var(--tc-ink-muted)' },
    taken: { label: 'Taken', bg: glass, color: 'var(--tc-ok-ink)' },
    missed: { label: 'Missed', bg: glass, color: 'var(--tc-warn-ink)' },
  };
  const it = map[status];
  const wrap: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '7px 11px 7px 9px',
    borderRadius: 'var(--tc-r-badge)',
    flex: 'none',
    background: it.bg,
    color: it.color,
  };
  return (
    <div style={wrap}>
      {status === 'taken' ? <CheckIcon size={15} /> : <ClockIcon size={15} />}
      <span style={{ fontSize: 'var(--tc-fs-badge)', fontWeight: 600, letterSpacing: '0.2px' }}>
        {it.label}
      </span>
    </div>
  );
}
