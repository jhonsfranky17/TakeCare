import type { CSSProperties } from 'react';
import type { Dose, DoseStatus } from './viewTypes';
import { Button } from './Button';
import { StatusBadge } from './StatusBadge';
import { CheckIcon, ClockIcon } from './icons';

const surface: Record<DoseStatus, CSSProperties> = {
  pending: { background: 'var(--tc-card)', borderColor: 'var(--tc-line)', boxShadow: 'var(--tc-shadow)' },
  taken: { background: 'var(--tc-ok-bg)', borderColor: 'var(--tc-ok-line)' },
  missed: { background: 'var(--tc-warn-bg)', borderColor: 'var(--tc-warn-line)' },
};

const iconTint: Record<DoseStatus, string> = {
  pending: 'var(--lima-700)',
  taken: 'var(--tc-ok-ink)',
  missed: 'var(--tc-warn-ink)',
};

export function DoseCard({
  dose,
  onMarkTaken,
  onUndo,
}: {
  dose: Dose;
  onMarkTaken: (id: string) => void;
  onUndo: (id: string) => void;
}) {
  const card: CSSProperties = {
    borderRadius: 24,
    padding: 18,
    display: 'flex',
    flexDirection: 'column',
    gap: 14,
    borderWidth: 1.5,
    borderStyle: 'solid',
    ...surface[dose.status],
  };
  const iconBox: CSSProperties = {
    width: 48,
    height: 48,
    borderRadius: 16,
    flex: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: dose.status === 'pending' ? 'var(--tc-pill)' : 'rgba(255, 255, 255, 0.6)',
    color: iconTint[dose.status],
  };

  return (
    <div style={card}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
        <div style={iconBox}>
          {dose.status === 'taken' ? <CheckIcon size={24} /> : <ClockIcon size={24} />}
        </div>
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 3 }}>
          <div style={{ fontSize: 'var(--tc-fs-card)', fontWeight: 600, letterSpacing: '-0.2px' }}>
            {dose.medicineName}
          </div>
          <div style={{ fontSize: 'var(--tc-fs-body)', fontWeight: 400, color: 'var(--tc-ink-muted)' }}>
            {dose.dosage} · {dose.scheduledTime}
          </div>
        </div>
        <StatusBadge
          status={dose.status}
          dueLabel={'Due ' + dose.scheduledTime.replace(':00', '')}
        />
      </div>

      {dose.status === 'pending' && (
        <Button variant="primary" onClick={() => onMarkTaken(dose.id)}>
          <CheckIcon size={22} />
          Mark as Taken
        </Button>
      )}

      {dose.status === 'taken' && (
        <div
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10,
            borderTop: '1px solid var(--tc-ok-line)', paddingTop: 12,
          }}
        >
          <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--tc-ok-ink)' }}>
            {dose.takenAt === 'just now' ? 'Marked as taken just now' : 'Taken at ' + dose.takenAt}
          </div>
          <Button variant="quiet" onClick={() => onUndo(dose.id)}>Undo</Button>
        </div>
      )}

      {dose.status === 'missed' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ fontSize: 14, fontWeight: 400, lineHeight: 1.5, color: 'var(--tc-warn-ink)' }}>
            This one slipped by. No harm done — you can still log it, or skip it if you&rsquo;d rather.
          </div>
          <Button variant="recovery" onClick={() => onMarkTaken(dose.id)}>Log it now anyway</Button>
        </div>
      )}
    </div>
  );
}
