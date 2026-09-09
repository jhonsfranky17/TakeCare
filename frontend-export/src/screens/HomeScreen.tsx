import type { Dose } from '../data/types';
import { DoseCard } from '../ui/DoseCard';

function summaryLine(pending: number, missed: number): string {
  if (pending === 0) return 'All done for today — the whole family can relax.';
  const head = pending === 1 ? 'One more this evening' : pending + ' more this evening';
  const tail = missed > 0 ? ' · ' + missed + ' to catch up on' : '';
  return head + tail + '. You are doing great.';
}

export function HomeScreen({
  doses,
  dateLabel,
  greeting = 'Good evening',
  onMarkTaken,
  onUndo,
}: {
  doses: Dose[];
  dateLabel: string;
  greeting?: string;
  onMarkTaken: (id: string) => void;
  onUndo: (id: string) => void;
}) {
  const taken = doses.filter((d) => d.status === 'taken').length;
  const pending = doses.filter((d) => d.status === 'pending').length;
  const missed = doses.filter((d) => d.status === 'missed').length;

  return (
    <div style={{ padding: '62px 20px 24px', display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div style={{ fontSize: 'var(--tc-fs-title)', fontWeight: 700, letterSpacing: '-0.5px', lineHeight: 1.15 }}>
            {greeting}, Dad
          </div>
          <div style={{ fontSize: 'var(--tc-fs-body)', fontWeight: 400, color: 'var(--tc-ink-muted)' }}>
            {dateLabel}
          </div>
        </div>
        <div
          style={{
            width: 44, height: 44, borderRadius: 14, background: 'var(--tc-pill)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 15, fontWeight: 600, color: 'var(--tc-ok-ink)',
          }}
        >
          R
        </div>
      </div>

      <div
        style={{
          background: 'var(--tc-card)', border: '1px solid var(--tc-line)',
          borderRadius: 'var(--tc-r-card)', padding: 18,
          display: 'flex', alignItems: 'center', gap: 16, boxShadow: 'var(--tc-shadow)',
        }}
      >
        <div
          style={{
            width: 56, height: 56, borderRadius: '50%', background: 'var(--tc-ok-bg)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 16, fontWeight: 700, color: 'var(--tc-ok-ink)', flex: 'none',
          }}
        >
          {taken}/{doses.length}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5, minWidth: 0 }}>
          <div style={{ fontSize: 16, fontWeight: 600 }}>
            {taken} of {doses.length} doses logged today
          </div>
          <div style={{ fontSize: 13.5, fontWeight: 400, color: 'var(--tc-ink-muted)', lineHeight: 1.45 }}>
            {summaryLine(pending, missed)}
          </div>
        </div>
      </div>

      <div
        style={{
          fontSize: 13, fontWeight: 600, letterSpacing: '0.9px', textTransform: 'uppercase',
          color: 'var(--tc-ink-muted)', marginTop: 4,
        }}
      >
        Today&rsquo;s doses
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {doses.map((dose) => (
          <DoseCard key={dose.id} dose={dose} onMarkTaken={onMarkTaken} onUndo={onUndo} />
        ))}
      </div>
    </div>
  );
}
