import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "./supabaseClient";
import { unsubscribeFromPush } from "./push";
import type { FamilyMember, Patient } from "./types";

interface AuthState {
  session: Session | null;
  familyMember: FamilyMember | null;
  patient: Patient | null;
  unclaimedMembers: FamilyMember[];
  loading: boolean;
  // Claims an existing, unclaimed family_members row as this device's
  // identity (the "who are you?" dropdown). New people are added ahead of
  // time from the Family screen, by name -- not from this screen -- so two
  // devices can never race to create the same person twice.
  claimFamilyMember: (id: string) => Promise<void>;
  // Releases this device's claim (auth_user_id back to null) rather than
  // deleting the row -- there's no email/password to log back in with, so
  // "logging back in" is re-picking this same row from the dropdown. That's
  // what keeps logout from ever producing a duplicate entry.
  logout: () => Promise<void>;
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

  const logout = async (): Promise<void> => {
    if (!familyMember) return;
    const releasing = familyMember;

    // Order matters: push_subscriptions_delete's RLS still requires this
    // device to be the claimed owner, so clean those up before releasing.
    await unsubscribeFromPush(releasing.id);

    const { error } = await supabase
      .from("family_members")
      .update({ auth_user_id: null })
      .eq("id", releasing.id);

    if (error) {
      throw error;
    }
    setFamilyMember(null);
    setUnclaimedMembers((prev) => [...prev, { ...releasing, auth_user_id: null }]);
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
        logout,
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
