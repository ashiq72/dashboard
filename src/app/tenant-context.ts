import { createContext, useContext } from "react";
import type { TenantWorkspace } from "../types";

type TenantContextValue = {
  tenant: TenantWorkspace | null;
  loading: boolean;
  error: string | null;
  refreshTenant: () => Promise<void>;
};

export const TenantContext = createContext<TenantContextValue | null>(null);

export const useTenant = () => {
  const value = useContext(TenantContext);
  if (!value) throw new Error("Tenant context missing");
  return value;
};
