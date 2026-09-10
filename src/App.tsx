import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider, useAuth } from "./lib/AuthContext";
import { NavBar } from "./components/NavBar";
import { LoadingScreen } from "./components/LoadingScreen";
import { WhoAreYou } from "./screens/WhoAreYou";
import { Home } from "./screens/Home";
import { History } from "./screens/History";
import { MedicinesAdmin } from "./screens/MedicinesAdmin";
import { Family } from "./screens/Family";

const shell = {
  position: "relative",
  height: "100%",
  display: "flex",
  flexDirection: "column",
  overflow: "hidden",
  fontFamily: "var(--tc-font)",
  background: "var(--tc-bg)",
  color: "var(--tc-ink)",
  WebkitFontSmoothing: "antialiased",
} as const;

const centered = {
  flex: 1,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: "var(--tc-ink-muted)",
  fontSize: 15,
  textAlign: "center",
  padding: "0 28px",
} as const;

function RequireAuth({ children }: { children: JSX.Element }): JSX.Element {
  const { session, familyMember, loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }
  if (!session) {
    // Only reached if the silent anonymous sign-in itself failed (e.g. it's
    // disabled on the project, or a network error) -- there's no login
    // screen to fall back to anymore.
    return <div style={centered}>Couldn&rsquo;t connect. Check your connection and reload.</div>;
  }
  if (!familyMember) {
    return <WhoAreYou />;
  }
  return children;
}

function AppShell(): JSX.Element {
  const { session, familyMember } = useAuth();

  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <div style={shell}>
        <div style={{ flex: 1, minHeight: 0, overflowY: "auto", WebkitOverflowScrolling: "touch" }}>
          <Routes>
            <Route
              path="/"
              element={
                <RequireAuth>
                  <Home />
                </RequireAuth>
              }
            />
            <Route
              path="/history"
              element={
                <RequireAuth>
                  <History />
                </RequireAuth>
              }
            />
            <Route
              path="/medicines"
              element={
                <RequireAuth>
                  <MedicinesAdmin />
                </RequireAuth>
              }
            />
            <Route
              path="/family"
              element={
                <RequireAuth>
                  <Family />
                </RequireAuth>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
        {session && familyMember && <NavBar />}
      </div>
    </BrowserRouter>
  );
}

export default function App(): JSX.Element {
  return (
    <AuthProvider>
      <AppShell />
    </AuthProvider>
  );
}
