import { createContext, type ReactNode, useContext, useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { clearSession, getStoredSession } from "../lib/session";
import type { AuthSession } from "../types";

type AuthContextValue = {
  session: AuthSession | null;
  setSession: (session: AuthSession | null) => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export const useAuth = () => {
  const value = useContext(AuthContext);
  if (!value) throw new Error("Auth context missing");
  return value;
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSessionState] = useState<AuthSession | null>(() =>
    getStoredSession(),
  );

  useEffect(() => {
    const refreshSession = () => setSessionState(getStoredSession());
    const expireSession = () => setSessionState(null);

    window.addEventListener("storage", refreshSession);
    window.addEventListener("commerce360:session-expired", expireSession);

    return () => {
      window.removeEventListener("storage", refreshSession);
      window.removeEventListener("commerce360:session-expired", expireSession);
    };
  }, []);

  const setSession = (next: AuthSession | null) => {
    if (!next) clearSession();
    setSessionState(next);
  };

  return (
    <AuthContext.Provider value={{ session, setSession }}>
      {children}
    </AuthContext.Provider>
  );
}

export function RequireAuth({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  if (!session) return <Navigate to="/login" replace />;
  return children;
}
