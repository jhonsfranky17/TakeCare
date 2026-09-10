import { useEffect, useState, type FormEvent } from "react";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../lib/AuthContext";
import { initialsOf } from "../lib/format";
import { Button } from "../ui/Button";
import { Toast } from "../ui/Toast";
import { LoadingScreen } from "../components/LoadingScreen";
import { ThemeToggle } from "../components/ThemeToggle";
import type { FamilyMember } from "../lib/types";

const field = {
  height: 52,
  borderRadius: 16,
  border: "1.5px solid var(--tc-line)",
  background: "var(--tc-card)",
  padding: "0 16px",
  fontFamily: "var(--tc-font)",
  fontSize: 15,
  fontWeight: 500,
  color: "var(--tc-ink)",
  outline: "none",
} as const;

export function Family(): JSX.Element {
  const { patient, familyMember } = useAuth();
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [addingName, setAddingName] = useState("");
  const [addingRelationship, setAddingRelationship] = useState("");
  const [saving, setSaving] = useState(false);

  const loadMembers = async (): Promise<void> => {
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
  };

  useEffect(() => {
    void loadMembers();
  }, []);

  const inviteLink = window.location.origin;

  const handleInvite = async (): Promise<void> => {
    await navigator.clipboard.writeText(inviteLink);
    setToast("Invite link copied, send it to whoever should get updates.");
  };

  // Pre-adds someone who hasn't opened the app yet, so they see themselves
  // waiting to be claimed the first time they do (no email involved at all
  // -- this device just inserts a placeholder row for them by name).
  const handleAddPlaceholder = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    if (!patient || !addingName.trim() || !addingRelationship.trim()) return;

    setSaving(true);
    setError(null);
    const { error: insertError } = await supabase.from("family_members").insert({
      patient_id: patient.id,
      name: addingName.trim(),
      relationship: addingRelationship.trim(),
      auth_user_id: null,
    });
    setSaving(false);

    if (insertError) {
      setError(insertError.message);
      return;
    }
    setAddingName("");
    setAddingRelationship("");
    await loadMembers();
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
          const joined = member.auth_user_id !== null;
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
                opacity: joined ? 1 : 0.7,
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
                  {!joined && " · hasn't opened the app yet"}
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
          gap: 14,
          alignItems: "stretch",
          background: "var(--tc-card)",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <div style={{ fontSize: 16, fontWeight: 600 }}>Add someone to the family</div>
          <div style={{ fontSize: 13.5, fontWeight: 400, lineHeight: 1.5, color: "var(--tc-ink-muted)" }}>
            Add their name now — they&rsquo;ll see themselves waiting the first time they open the app on
            their own phone, no email needed.
          </div>
        </div>

        <form onSubmit={(e) => void handleAddPlaceholder(e)} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <input
            value={addingName}
            onChange={(e) => setAddingName(e.target.value)}
            placeholder="Their name"
            aria-label="Name"
            style={field}
          />
          <input
            value={addingRelationship}
            onChange={(e) => setAddingRelationship(e.target.value)}
            placeholder="Relationship, e.g. Daughter"
            aria-label="Relationship"
            style={field}
          />
          <Button variant="dark" type="submit" disabled={saving || !addingName.trim() || !addingRelationship.trim()}>
            {saving ? "Adding…" : "Add to the family"}
          </Button>
        </form>

        <Button variant="quiet" style={{ alignSelf: "center" }} onClick={() => void handleInvite()}>
          or just share the app link
        </Button>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <div
          style={{
            fontSize: 13,
            fontWeight: 600,
            letterSpacing: "0.9px",
            textTransform: "uppercase",
            color: "var(--tc-ink-muted)",
          }}
        >
          Appearance
        </div>
        <ThemeToggle />
      </div>

      {toast && <Toast message={toast} />}
    </div>
  );
}
