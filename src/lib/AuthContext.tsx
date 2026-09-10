import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "./supabaseClient";
import type { FamilyMember, Patient } from "./types";

interface AuthState {
  session: Session | null;
  familyMember: FamilyMember | null;
  patient: Patient | null;
  unclaimedMembers: FamilyMember[];
  loading: boolean;
  // Claims an existing, unclaimed family_members row as this device's
  // identity (the "who are you?" picker).
  claimFamilyMember: (id: string) => Promise<void>;
  // Creates a brand-new family_members row and claims it in one step (the
  // "not listed? add yourself" path, and Family screen's "add someone").
  completeOnboarding: (name: string, relationship: string) => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }): JSX.Element {
  const [session, setSession] = useState<Session | null>(null);
  const [familyMember, setFamilyMember] = useState<FamilyMember | null>(null);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [unclaimedMembers, setUnclaimedMembers] = useState<FamilyMember[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;

    async function loadForSession(current: Session): Promise<void> {
      setSession(current);

      const [{ data: patientRow }, { data: memberRow, error: memberError }, { data: unclaimedRows }] =
        await Promise.all([
          supabase.from("patients").select("*").limit(1).maybeSingle(),
          supabase
            .from("family_members")
            .select("*")
            .eq("auth_user_id", current.user.id)
            .maybeSingle(),
          supabase.from("family_members").select("*").is("auth_user_id", null),
        ]);

      if (!isMounted) return;

      setPatient(patientRow ?? null);
      if (memberError) {
        console.error("failed to look up family member:", memberError);
      }
      setFamilyMember(memberRow ?? null);
      setUnclaimedMembers(unclaimedRows ?? []);
      setLoading(false);
    }

    async function init(): Promise<void> {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        await loadForSession(data.session);
        return;
      }

      // No device has ever opened this app before -- sign in anonymously,
      // no user interaction needed. This is a real (if anonymous) session,
      // so RLS still applies once a family_members row is claimed under it.
      const { data: anon, error } = await supabase.auth.signInAnonymously();
      if (error || !anon.session) {
        console.error("anonymous sign-in failed:", error);
        if (isMounted) setLoading(false);
        return;
      }
      await loadForSession(anon.session);
    }

    void init();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, next) => {
      if (next) {
        setLoading(true);
        void loadForSession(next);
      }
    });

    return () => {
      isMounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const claimFamilyMember = async (id: string): Promise<void> => {
    if (!session) {
      throw new Error("No session to claim a family member with");
    }
    const { data: claimed, error } = await supabase
      .from("family_members")
      .update({ auth_user_id: session.user.id })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      throw error;
    }
    setFamilyMember(claimed);
    setUnclaimedMembers((prev) => prev.filter((m) => m.id !== id));
  };

  const completeOnboarding = async (name: string, relationship: string): Promise<void> => {
    if (!session || !patient) {
      throw new Error("Cannot complete onboarding without a session and patient");
    }
    const { data: created, error } = await supabase
      .from("family_members")
      .insert({
        patient_id: patient.id,
        name,
        relationship,
        auth_user_id: session.user.id,
      })
      .select()
      .single();

    if (error) {
      throw error;
    }
    setFamilyMember(created);
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        familyMember,
        patient,
        unclaimedMembers,
        loading,
        claimFamilyMember,
        completeOnboarding,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
