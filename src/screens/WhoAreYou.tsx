import { useState, type FormEvent } from "react";
import { useAuth } from "../lib/AuthContext";
import { Button } from "../ui/Button";
import { TakeCareLogo } from "../TakeCareLogo";
import { initialsOf } from "../lib/format";

const field = {
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

const labelStyle = { fontSize: 13.5, fontWeight: 600, color: "var(--tc-ink-muted)" } as const;

/**
 * The app's entry screen -- shown once per device, right after the silent
 * anonymous sign-in, until this device claims a family_members row. No
 * email, no password, no link to click: tap your name (or add yourself if
 * you're not listed yet) and this device remembers you from then on.
 */
export function WhoAreYou(): JSX.Element {
  const { patient, unclaimedMembers, claimFamilyMember, completeOnboarding } = useAuth();
  const [adding, setAdding] = useState(unclaimedMembers.length === 0);
  const [name, setName] = useState("");
  const [relationship, setRelationship] = useState("");
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

  const handleClaim = async (id: string): Promise<void> => {
    setSubmitting(true);
    setError(null);
    try {
      await claimFamilyMember(id);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setSubmitting(false);
    }
  };

  const handleAdd = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    if (!name.trim() || !relationship.trim()) return;

    setSubmitting(true);
    setError(null);
    try {
      await completeOnboarding(name.trim(), relationship.trim());
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
            {adding ? "Welcome to the family" : "Who's this?"}
          </div>
          <div style={{ fontSize: 15, fontWeight: 400, lineHeight: 1.5, color: "var(--tc-ink-muted)", maxWidth: 300 }}>
            {adding
              ? `A couple of details so ${patient.name} and everyone else know who you are.`
              : `Tap your name to start getting ${patient.name}'s dose updates on this device.`}
          </div>
        </div>
      </div>

      {!adding && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {unclaimedMembers.map((member) => (
            <button
              key={member.id}
              type="button"
              disabled={submitting}
              onClick={() => void handleClaim(member.id)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                background: "var(--tc-card)",
                border: "1.5px solid var(--tc-line)",
                borderRadius: "var(--tc-r-card)",
                padding: "14px 16px",
                fontFamily: "var(--tc-font)",
                cursor: submitting ? "default" : "pointer",
                textAlign: "left",
              }}
            >
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 16,
                  flex: "none",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 16,
                  fontWeight: 600,
                  background: "var(--tc-pill)",
                  color: "var(--tc-ok-ink)",
                }}
              >
                {initialsOf(member.name)}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <div style={{ fontSize: 17, fontWeight: 600 }}>{member.name}</div>
                {member.relationship && (
                  <div style={{ fontSize: 13.5, color: "var(--tc-ink-muted)" }}>{member.relationship}</div>
                )}
              </div>
            </button>
          ))}

          <Button variant="quiet" style={{ alignSelf: "center" }} onClick={() => setAdding(true)}>
            Not listed? Add yourself
          </Button>
        </div>
      )}

      {adding && (
        <form onSubmit={(e) => void handleAdd(e)} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
            <label htmlFor="tc-onboard-name" style={labelStyle}>
              Your name
            </label>
            <input
              id="tc-onboard-name"
              required
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Priya"
              style={field}
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
            <label htmlFor="tc-onboard-relationship" style={labelStyle}>
              Your relationship to {patient.name}
            </label>
            <input
              id="tc-onboard-relationship"
              required
              value={relationship}
              onChange={(e) => setRelationship(e.target.value)}
              placeholder="e.g. Daughter, Son, Caregiver"
              style={field}
            />
          </div>

          <Button variant="primary" type="submit" disabled={submitting} style={{ marginTop: 4 }}>
            {submitting ? "Saving…" : "Continue"}
          </Button>

          {unclaimedMembers.length > 0 && (
            <Button variant="quiet" style={{ alignSelf: "center" }} onClick={() => setAdding(false)}>
              Back to the list
            </Button>
          )}
        </form>
      )}

      {error && (
        <div style={{ fontSize: 13.5, lineHeight: 1.5, color: "var(--tc-warn-ink)", textAlign: "center" }}>
          {error}
        </div>
      )}
    </div>
  );
}
