import {
  type ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { ecommerceApi } from "../lib/api";
import type { TenantWorkspace } from "../types";
import { useAuth } from "./auth-context";
import { TenantContext } from "./tenant-context";
import { getErrorMessage } from "../shared/utils";

export function TenantProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const requestId = useRef(0);
  const [result, setResult] = useState<{
    token?: string;
    tenant: TenantWorkspace | null;
    loading: boolean;
    error: string | null;
  }>({ tenant: null, loading: false, error: null });

  const refreshTenant = useCallback(async () => {
    const currentRequest = ++requestId.current;
    if (!session) {
      setResult({ tenant: null, loading: false, error: null });
      return;
    }

    setResult((previous) => ({
      token: session.token,
      tenant: previous.token === session.token ? previous.tenant : null,
      loading: true,
      error: null,
    }));
    try {
      const response = await ecommerceApi.currentTenant();
      if (!response.data || response.data.tenantId !== session.tenantId) {
        throw new Error(
          "The workspace response does not match your signed-in store.",
        );
      }
      if (currentRequest === requestId.current) {
        setResult({
          token: session.token,
          tenant: response.data,
          loading: false,
          error: null,
        });
      }
    } catch (error) {
      if (currentRequest === requestId.current) {
        setResult({
          token: session.token,
          tenant: null,
          loading: false,
          error: getErrorMessage(
            error,
            "Unable to load your workspace. Try refreshing.",
          ),
        });
      }
    }
  }, [session]);

  useEffect(() => {
    void refreshTenant();
    return () => {
      requestId.current++;
    };
  }, [refreshTenant]);

  const matchesSession = Boolean(session && result.token === session.token);
  const tenant = matchesSession ? result.tenant : null;
  const loading = Boolean(session) && (!matchesSession || result.loading);
  const error = matchesSession ? result.error : null;

  return (
    <TenantContext.Provider value={{ tenant, loading, error, refreshTenant }}>
      {children}
    </TenantContext.Provider>
  );
}
