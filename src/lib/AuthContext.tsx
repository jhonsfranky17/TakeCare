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
  loading: boolean;
  signOut: () => Promise<void>;
  // Creates this user's family_members row with a name/relationship they
  // chose themselves (see Onboarding screen). TakeCare is a single-patient
  // deployment (build spec section 2), so this links them to the one
  // existing patient.
  completeOnboarding: (name: string, relationship: string) => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }): JSX.Element {
  const [session, setSession] = useState<Session | null>(null);
  const [familyMember, setFamilyMember] = useState<FamilyMember | null>(null);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;

    async function loadForSession(current: Session | null): Promise<void> {
      setSession(current);

      if (!current) {
        setFamilyMember(null);
        setPatient(null);
        setLoading(false);
        return;
      }

      const [{ data: patientRow }, { data: memberRow, error: memberError }] = await Promise.all([
        supabase.from("patients").select("*").limit(1).maybeSingle(),
        supabase
          .from("family_members")
          .select("*")
          .eq("auth_user_id", current.user.id)
          .maybeSingle(),
      ]);

      if (!isMounted) return;

      setPatient(patientRow ?? null);
      if (memberError) {
        console.error("failed to look up family member:", memberError);
      }
      setFamilyMember(memberRow ?? null);
      setLoading(false);
    }

    supabase.auth.getSession().then(({ data }) => {
      void loadForSession(data.session);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, next) => {
      setLoading(true);
      void loadForSession(next);
    });

    return () => {
      isMounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const signOut = async (): Promise<void> => {
    await supabase.auth.signOut();
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
      value={{ session, familyMember, patient, loading, signOut, completeOnboarding }}
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
