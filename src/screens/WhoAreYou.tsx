import { useState } from "react";
import { useAuth } from "../lib/AuthContext";
import { Button } from "../ui/Button";
import { TakeCareLogo } from "../TakeCareLogo";

const selectField = {
  height: 56,
  borderRadius: 16,
  border: "1.5px solid var(--tc-line)",
  background: "var(--tc-card)",
  padding: "0 16px",
  fontFamily: "var(--tc-font)",
  fontSize: 16,
  fontWeight: 500,
  color: "var(--tc-ink)",
  outline: "none",
} as const;

/**
 * The app's entry screen -- shown once per device, right after the silent
 * anonymous sign-in, until this device claims a family_members row. No
 * email, no password, no typing your own name (that used to let two devices
 * create the same person twice) -- pick yourself from the list a family
 * member has already added on the Family screen, and this device remembers
 * you from then on.
 */
export function WhoAreYou(): JSX.Element {
  const { patient, unclaimedMembers, claimFamilyMember } = useAuth();
  const [selectedId, setSelectedId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!patient) {
    return (
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          padding: "0 28px",
          color: "var(--tc-ink-muted)",
          fontSize: 14.5,
          lineHeight: 1.6,
        }}
      >
        This app isn&rsquo;t set up yet — ask whoever&rsquo;s setting up TakeCare to add the patient first.
      </div>
    );
  }

  const handleContinue = async (): Promise<void> => {
    if (!selectedId) return;
    setSubmitting(true);
    setError(null);
    try {
      await claimFamilyMember(selectedId);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setSubmitting(false);
    }
  };

  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: "64px 28px 40px",
        gap: 28,
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 18, alignItems: "flex-start" }}>
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: 18,
            background: "var(--tc-cta)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--lima-950)",
            boxShadow: "0 6px 18px rgba(149, 220, 6, 0.32)",
          }}
        >
          <TakeCareLogo size={32} />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ fontSize: "var(--tc-fs-title)", fontWeight: 700, letterSpacing: "-0.5px", lineHeight: 1.15 }}>
            Who's this?
          </div>
          <div style={{ fontSize: 15, fontWeight: 400, lineHeight: 1.5, color: "var(--tc-ink-muted)", maxWidth: 300 }}>
            Choose your name to start getting {patient.name}&rsquo;s dose updates on this device.
          </div>
        </div>
      </div>

      {unclaimedMembers.length === 0 ? (
        <div
          style={{
            fontSize: 14.5,
            lineHeight: 1.6,
            color: "var(--tc-ink-muted)",
            background: "var(--tc-pill)",
            borderRadius: 16,
            padding: "16px 18px",
          }}
        >
          Everyone&rsquo;s already been added. Ask a family member to add you from their Family tab, then
          reload this page.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <select
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            aria-label="Your name"
            style={selectField}
          >
            <option value="" disabled>
              Select your name…
            </option>
            {unclaimedMembers.map((member) => (
              <option key={member.id} value={member.id}>
                {member.name}
                {member.relationship ? ` (${member.relationship})` : ""}
              </option>
            ))}
          </select>

          <Button variant="primary" disabled={!selectedId || submitting} onClick={() => void handleContinue()}>
            {submitting ? "Saving…" : "This is me"}
          </Button>
        </div>
      )}

      {error && (
        <div style={{ fontSize: 13.5, lineHeight: 1.5, color: "var(--tc-warn-ink)", textAlign: "center" }}>
          {error}
        </div>
      )}
    </div>
  );
}
