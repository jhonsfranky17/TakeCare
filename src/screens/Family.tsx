import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../lib/AuthContext";
import { initialsOf } from "../lib/format";
import { Button } from "../ui/Button";
import { Toast } from "../ui/Toast";
import { LoadingScreen } from "../components/LoadingScreen";
import type { FamilyMember } from "../lib/types";

export function Family(): JSX.Element {
  const { patient, familyMember } = useAuth();
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    async function load(): Promise<void> {
      const { data, error: fetchError } = await supabase
        .from("family_members")
        .select("*")
        .order("created_at", { ascending: true });

      if (fetchError) {
        setError(fetchError.message);
      } else {
        setMembers(data ?? []);
      }
      setLoading(false);
    }
    void load();
  }, []);

  const inviteLink = window.location.origin;

  const handleInvite = async (): Promise<void> => {
    await navigator.clipboard.writeText(inviteLink);
    setToast("Invite link copied, send it to whoever should get updates.");
  };

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <div
      style={{
        padding: "62px 20px 24px",
        display: "flex",
        flexDirection: "column",
        gap: 18,
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
        <div
          style={{
            fontSize: "var(--tc-fs-title)",
            fontWeight: 700,
            letterSpacing: "-0.5px",
          }}
        >
          Family
        </div>
        <div
          style={{
            fontSize: "var(--tc-fs-body)",
            fontWeight: 400,
            color: "var(--tc-ink-muted)",
          }}
        >
          {members.length} {members.length === 1 ? "person is" : "people are"}{" "}
          looking out for
          {patient ? ` ${patient.name}` : " the family"}.
        </div>
      </div>

      {error && (
        <div style={{ fontSize: 13.5, color: "var(--tc-warn-ink)" }}>
          {error}
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {members.map((member) => {
          const isSelf = member.id === familyMember?.id;
          return (
            <div
              key={member.id}
              style={{
                background: "var(--tc-card)",
                border: "1px solid var(--tc-line)",
                borderRadius: "var(--tc-r-card)",
                padding: "16px 18px",
                display: "flex",
                alignItems: "center",
                gap: 14,
                boxShadow: "var(--tc-shadow)",
              }}
            >
              <div
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 18,
                  flex: "none",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 18,
                  fontWeight: 600,
                  background: isSelf ? "var(--tc-ok-bg)" : "var(--tc-pill)",
                  color: "var(--tc-ok-ink)",
                }}
              >
                {initialsOf(member.name)}
              </div>
              <div
                style={{
                  flex: 1,
                  minWidth: 0,
                  display: "flex",
                  flexDirection: "column",
                  gap: 3,
                }}
              >
                <div style={{ fontSize: 17, fontWeight: 600 }}>
                  {member.name}
                </div>
                <div
                  style={{
                    fontSize: 13.5,
                    fontWeight: 400,
                    color: "var(--tc-ink-muted)",
                  }}
                >
                  {member.relationship ?? "Family member"}
                </div>
              </div>
              {isSelf && (
                <div
                  style={{
                    padding: "7px 11px",
                    borderRadius: "var(--tc-r-badge)",
                    flex: "none",
                    background: "var(--tc-pill)",
                    color: "var(--tc-ink-muted)",
                    fontSize: "var(--tc-fs-badge)",
                    fontWeight: 600,
                  }}
                >
                  You
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div
        style={{
          border: "1.5px dashed var(--tc-line)",
          borderRadius: "var(--tc-r-card)",
          padding: 20,
          display: "flex",
          flexDirection: "column",
          gap: 12,
          alignItems: "flex-start",
          background: "var(--tc-card)",
        }}
      >
        <div style={{ fontSize: 16, fontWeight: 600 }}>
          Add someone to the family
        </div>
        <div
          style={{
            fontSize: 13.5,
            fontWeight: 400,
            lineHeight: 1.5,
            color: "var(--tc-ink-muted)",
          }}
        >
          Send a link and they'll start getting dose updates.
        </div>
        <Button variant="dark" onClick={() => void handleInvite()}>
          Share invite link
        </Button>
      </div>

      {toast && <Toast message={toast} />}
    </div>
  );
}
