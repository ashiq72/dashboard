import { createContext, useContext } from "react";
import type { AuthSession } from "../types";

type AuthContextValue = {
  session: AuthSession | null;
  setSession: (session: AuthSession | null) => void;
};

// Keep context identity outside component refresh boundaries.
export const AuthContext = createContext<AuthContextValue | null>(null);

export const useAuth = () => {
  const value = useContext(AuthContext);
  if (!value) throw new Error("Auth context missing");
  return value;
};
