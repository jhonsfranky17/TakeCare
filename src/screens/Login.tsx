import { useState, type FormEvent } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../lib/AuthContext";
import { Button } from "../ui/Button";
import { TakeCareLogo } from "../TakeCareLogo";

export function Login(): JSX.Element {
  const { session, loading } = useAuth();
  const [email, setEmail] = useState<string>("");
  const [sent, setSent] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);

  if (!loading && session) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>,
  ): Promise<void> => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    const { error: signInError } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin },
    });

    setSubmitting(false);

    if (signInError) {
      setError(signInError.message);
      return;
    }
    setSent(true);
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
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 18,
          alignItems: "flex-start",
        }}
      >
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: 20,
            background: "var(--tc-cta)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--lima-950)",
            boxShadow: "0 6px 18px rgba(149, 220, 6, 0.32)",
          }}
        >
          <TakeCareLogo size={38} />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div
            style={{
              fontSize: "var(--tc-fs-display)",
              fontWeight: 700,
              letterSpacing: "-0.8px",
              lineHeight: 1.1,
            }}
          >
            TakeCare
          </div>
          <div
            style={{
              fontSize: 17,
              fontWeight: 400,
              lineHeight: 1.5,
              color: "var(--tc-ink-muted)",
              maxWidth: 280,
            }}
          >
            Welcome back!
          </div>
        </div>
      </div>

      {sent ? (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 14,
            alignItems: "flex-start",
            background: "var(--tc-ok-bg)",
            border: "1px solid var(--tc-ok-line)",
            borderRadius: "var(--tc-r-card)",
            padding: 20,
          }}
        >
          <div
            style={{ fontSize: 16, fontWeight: 600, color: "var(--tc-ok-ink)" }}
          >
            Check your email
          </div>
          <div
            style={{
              fontSize: 13.5,
              lineHeight: 1.6,
              color: "var(--tc-ok-ink)",
            }}
          >
            We sent a sign-in link to {email}. Open it on this device to get in.
          </div>
        </div>
      ) : (
        <form
          onSubmit={(e) => void handleSubmit(e)}
          style={{ display: "flex", flexDirection: "column", gap: 14 }}
        >
          <label
            htmlFor="tc-email"
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: "var(--tc-ink-muted)",
            }}
          >
            Your email
          </label>
          <input
            id="tc-email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            style={{
              height: 60,
              borderRadius: 18,
              border: "1.5px solid var(--tc-line)",
              background: "var(--tc-card)",
              padding: "0 18px",
              fontFamily: "var(--tc-font)",
              fontSize: 17,
              fontWeight: 500,
              color: "var(--tc-ink)",
              outline: "none",
              boxShadow: "var(--tc-shadow)",
            }}
          />
          <Button variant="primary" type="submit" disabled={submitting}>
            {submitting ? "Sending…" : "Email me a sign-in link"}
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
          <div
            style={{
              fontSize: 13.5,
              lineHeight: 1.6,
              color: "var(--tc-ink-muted)",
              textAlign: "center",
              padding: "0 8px",
            }}
          >
            No password to remember. We&rsquo;ll email you a link that signs you
            in.
          </div>
        </form>
      )}
    </div>
  );
}
