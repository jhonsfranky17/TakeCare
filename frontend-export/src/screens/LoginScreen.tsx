import { useState } from 'react';
import { Button } from '../ui/Button';
import { TakeCareLogo } from '../TakeCareLogo';

export function LoginScreen({ onSendLink }: { onSendLink: (email: string) => void }) {
  const [email, setEmail] = useState('');
  return (
    <div
      style={{
        flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center',
        padding: '64px 28px 40px', gap: 28,
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18, alignItems: 'flex-start' }}>
        <div
          style={{
            width: 64, height: 64, borderRadius: 20, background: 'var(--tc-cta)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--lima-950)', boxShadow: '0 6px 18px rgba(149, 220, 6, 0.32)',
          }}
        >
          <TakeCareLogo size={38} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ fontSize: 'var(--tc-fs-display)', fontWeight: 700, letterSpacing: '-0.8px', lineHeight: 1.1 }}>
            TakeCare
          </div>
          <div
            style={{
              fontSize: 17, fontWeight: 400, lineHeight: 1.5,
              color: 'var(--tc-ink-muted)', maxWidth: 280,
            }}
          >
            Welcome back — let&rsquo;s check in on Dad.
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <label htmlFor="tc-email" style={{ fontSize: 14, fontWeight: 600, color: 'var(--tc-ink-muted)' }}>
          Your email
        </label>
        <input
          id="tc-email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@family.com"
          style={{
            height: 60, borderRadius: 18, border: '1.5px solid var(--tc-line)',
            background: 'var(--tc-card)', padding: '0 18px',
            fontFamily: 'var(--tc-font)', fontSize: 17, fontWeight: 500,
            color: 'var(--tc-ink)', outline: 'none', boxShadow: 'var(--tc-shadow)',
          }}
        />
        <Button variant="primary" onClick={() => onSendLink(email)}>
          Send me a sign-in link
        </Button>
        <div
          style={{
            fontSize: 13.5, lineHeight: 1.6, color: 'var(--tc-ink-muted)',
            textAlign: 'center', padding: '0 8px',
          }}
        >
          No password to remember. We&rsquo;ll email you a link that signs you in.
        </div>
      </div>
    </div>
  );
}
