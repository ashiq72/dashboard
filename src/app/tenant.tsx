import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import { ecommerceApi } from "../lib/api";
import type { TenantWorkspace } from "../types";
import { useAuth } from "./auth";

type TenantContextValue = {
  tenant: TenantWorkspace | null;
  loading: boolean;
  refreshTenant: () => Promise<void>;
};

const TenantContext = createContext<TenantContextValue | null>(null);

export const useTenant = () => {
  const value = useContext(TenantContext);
  if (!value) throw new Error("Tenant context missing");
  return value;
};

export function TenantProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const [tenant, setTenant] = useState<TenantWorkspace | null>(null);
  const [loading, setLoading] = useState(false);

  const refreshTenant = async () => {
    if (!session) {
      setTenant(null);
      return;
    }

    setLoading(true);
    try {
      const response = await ecommerceApi.currentTenant();
      setTenant(response.data);
    } catch {
      setTenant(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    if (!session) {
      setTenant(null);
      return;
    }

    setLoading(true);
    void ecommerceApi
      .currentTenant()
      .then((response) => {
        if (active) setTenant(response.data);
      })
      .catch(() => {
        if (active) setTenant(null);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [session]);

  return (
    <TenantContext.Provider value={{ tenant, loading, refreshTenant }}>
      {children}
    </TenantContext.Provider>
  );
}
