import { useState, type FormEvent } from "react";
import { useAuth } from "../lib/AuthContext";
import { Button } from "../ui/Button";

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

const labelStyle = {
  fontSize: 13.5,
  fontWeight: 600,
  color: "var(--tc-ink-muted)",
} as const;

export function Onboarding(): JSX.Element {
  const { patient, completeOnboarding } = useAuth();
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
        This app isn&rsquo;t set up yet - ask whoever&rsquo;s setting up
        TakeCare to add the patient first.
      </div>
    );
  }

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>,
  ): Promise<void> => {
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
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <div
          style={{
            fontSize: "var(--tc-fs-title)",
            fontWeight: 700,
            letterSpacing: "-0.5px",
            lineHeight: 1.15,
          }}
        >
          Welcome to the family
        </div>
        <div
          style={{
            fontSize: 15,
            fontWeight: 400,
            lineHeight: 1.5,
            color: "var(--tc-ink-muted)",
            maxWidth: 300,
          }}
        >
          A couple of details so {patient ? patient.name : "the family"} and
          everyone else know who you are.
        </div>
      </div>

      <form
        onSubmit={(e) => void handleSubmit(e)}
        style={{ display: "flex", flexDirection: "column", gap: 14 }}
      >
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
            Your relationship to {patient ? patient.name : "them"}
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

        <Button
          variant="primary"
          type="submit"
          disabled={submitting}
          style={{ marginTop: 4 }}
        >
          {submitting ? "Saving…" : "Continue"}
        </Button>

        {error && (
          <div
            style={{
              fontSize: 13.5,
              lineHeight: 1.5,
              color: "var(--tc-warn-ink)",
              textAlign: "center",
            }}
          >
            {error}
          </div>
        )}
      </form>
    </div>
  );
}
