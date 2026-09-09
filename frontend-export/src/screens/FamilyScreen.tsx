import type { FamilyMember } from '../data/types';
import { Button } from '../ui/Button';

export function FamilyScreen({
  members,
  onInvite,
}: {
  members: FamilyMember[];
  onInvite: () => void;
}) {
  return (
    <div style={{ padding: '62px 20px 24px', display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
        <div style={{ fontSize: 'var(--tc-fs-title)', fontWeight: 700, letterSpacing: '-0.5px' }}>Family</div>
        <div style={{ fontSize: 'var(--tc-fs-body)', fontWeight: 400, color: 'var(--tc-ink-muted)' }}>
          {members.length === 3 ? 'Three people are looking out for Dad.' : members.length + ' people are looking out for Dad.'}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {members.map((m) => (
          <div
            key={m.id}
            style={{
              background: 'var(--tc-card)', border: '1px solid var(--tc-line)',
              borderRadius: 'var(--tc-r-card)', padding: '16px 18px',
              display: 'flex', alignItems: 'center', gap: 14, boxShadow: 'var(--tc-shadow)',
            }}
          >
            <div
              style={{
                width: 52, height: 52, borderRadius: 18, flex: 'none',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 18, fontWeight: 600,
                background: m.notify === 'all' ? 'var(--tc-ok-bg)' : 'var(--tc-pill)',
                color: 'var(--tc-ok-ink)',
              }}
            >
              {m.initials}
            </div>
            <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 3 }}>
              <div style={{ fontSize: 17, fontWeight: 600 }}>{m.name}</div>
              <div style={{ fontSize: 13.5, fontWeight: 400, color: 'var(--tc-ink-muted)' }}>
                {m.relation} · {m.notify === 'all' ? 'notified on every dose' : 'notified on missed doses'}
              </div>
            </div>
            <div
              style={{
                padding: '7px 11px', borderRadius: 'var(--tc-r-badge)', flex: 'none',
                background: 'var(--tc-pill)', color: 'var(--tc-ink-muted)',
                fontSize: 'var(--tc-fs-badge)', fontWeight: 600,
              }}
            >
              {m.notify === 'all' ? 'All alerts' : 'Missed only'}
            </div>
          </div>
        ))}
      </div>

      <div
        style={{
          border: '1.5px dashed var(--tc-line)', borderRadius: 'var(--tc-r-card)', padding: 20,
          display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'flex-start',
          background: 'var(--tc-card)',
        }}
      >
        <div style={{ fontSize: 16, fontWeight: 600 }}>Add someone to the circle</div>
        <div style={{ fontSize: 13.5, fontWeight: 400, lineHeight: 1.5, color: 'var(--tc-ink-muted)' }}>
          Send a link and they&rsquo;ll start getting Dad&rsquo;s dose updates — no setup needed.
        </div>
        <Button variant="dark" onClick={onInvite}>Share invite link</Button>
      </div>
    </div>
  );
}
