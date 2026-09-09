import { useEffect, useRef, useState } from 'react';
import type { ComponentType } from 'react';
import type { Dose, ScreenName } from './data/types';
import { familyMembers, historyDays, medicines, todaysDoses } from './data/mockData';
import { FamilyIcon, HomeIcon, ClockIcon, PillIcon } from './ui/icons';
import { Toast } from './ui/Toast';
import { LoginScreen } from './screens/LoginScreen';
import { HomeScreen } from './screens/HomeScreen';
import { HistoryScreen } from './screens/HistoryScreen';
import { MedicinesScreen } from './screens/MedicinesScreen';
import { AddMedicineSheet } from './screens/AddMedicineSheet';
import { FamilyScreen } from './screens/FamilyScreen';

type Tab = { key: Exclude<ScreenName, 'login'>; label: string; Icon: ComponentType<{ size?: number }> };

const TABS: Tab[] = [
  { key: 'home', label: 'Home', Icon: HomeIcon },
  { key: 'history', label: 'History', Icon: ClockIcon },
  { key: 'medicines', label: 'Medicines', Icon: PillIcon },
  { key: 'family', label: 'Family', Icon: FamilyIcon },
];

export function TakeCareApp({ initialScreen = 'login' }: { initialScreen?: ScreenName }) {
  const [screen, setScreen] = useState<ScreenName>(initialScreen);
  const [doses, setDoses] = useState<Dose[]>(todaysDoses);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const timer = useRef<number | null>(null);

  useEffect(() => () => { if (timer.current) window.clearTimeout(timer.current); }, []);

  function flash(message: string) {
    setToast(message);
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setToast(null), 3400);
  }

  // TODO: replace with supabase.functions.invoke('log-intake', { body: { intake_log_id: id } })
  function markTaken(id: string) {
    setDoses((prev) => prev.map((d) => (d.id === id ? { ...d, status: 'taken', takenAt: 'just now' } : d)));
    flash('Logged. Priya, Arjun and Meera just got the good news.');
  }

  function undo(id: string) {
    setDoses((prev) => prev.map((d) => (d.id === id ? { ...d, status: 'pending', takenAt: null } : d)));
    setToast(null);
  }

  const shell = {
    position: 'relative', height: '100%', display: 'flex', flexDirection: 'column',
    overflow: 'hidden', fontFamily: 'var(--tc-font)', background: 'var(--tc-bg)', color: 'var(--tc-ink)',
    WebkitFontSmoothing: 'antialiased',
  } as const;

  if (screen === 'login') {
    return (
      <div style={shell}>
        <LoginScreen onSendLink={() => setScreen('home')} />
      </div>
    );
  }

  return (
    <div style={shell}>
      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
        {screen === 'home' && (
          <HomeScreen doses={doses} dateLabel="Tuesday, 8 September" onMarkTaken={markTaken} onUndo={undo} />
        )}
        {screen === 'history' && (
          <HistoryScreen days={historyDays} headline="14 of the last 15 days fully on track." />
        )}
        {screen === 'medicines' && (
          <MedicinesScreen medicines={medicines} onAdd={() => setSheetOpen(true)} onEdit={() => setSheetOpen(true)} />
        )}
        {screen === 'family' && (
          <FamilyScreen members={familyMembers} onInvite={() => flash('Invite link copied — send it to whoever should get updates.')} />
        )}
      </div>

      {/* Bottom tab bar — 26px bottom padding clears the iOS home indicator. */}
      <nav
        style={{
          flex: 'none', background: 'var(--tc-card)', borderTop: '1px solid var(--tc-line)',
          padding: '8px 8px 26px', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 4,
        }}
      >
        {TABS.map(({ key, label, Icon }) => {
          const on = screen === key;
          return (
            <button
              key={key}
              type="button"
              aria-current={on ? 'page' : undefined}
              onClick={() => setScreen(key)}
              style={{
                border: 'none', cursor: 'pointer', minHeight: 56, padding: '6px 0',
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                justifyContent: 'center', gap: 5, borderRadius: 16,
                fontFamily: 'var(--tc-font)',
                background: on ? 'var(--tc-ok-bg)' : 'transparent',
                color: on ? 'var(--tc-ok-ink)' : 'var(--tc-ink-muted)',
              }}
            >
              <Icon size={23} />
              <span style={{ fontSize: 'var(--tc-fs-tab)', fontWeight: on ? 600 : 500, letterSpacing: '0.1px' }}>
                {label}
              </span>
            </button>
          );
        })}
      </nav>

      {sheetOpen && (
        <AddMedicineSheet onClose={() => setSheetOpen(false)} onSave={() => setSheetOpen(false)} />
      )}
      {toast && <Toast message={toast} />}
    </div>
  );
}
