import type { AuthSession, SessionUser } from "../types";

const STORAGE_KEY = "commerce360.session";

const decodeJwtPayload = (token: string): SessionUser | undefined => {
  try {
    const payload = token.split(".")[1];
    if (!payload) return undefined;
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const json = decodeURIComponent(
      atob(normalized)
        .split("")
        .map((char) => `%${`00${char.charCodeAt(0).toString(16)}`.slice(-2)}`)
        .join(""),
    );
    return JSON.parse(json) as SessionUser;
  } catch {
    return undefined;
  }
};

const isExpired = (session: AuthSession) => {
  if (!session.user?.exp) return false;
  return session.user.exp * 1000 <= Date.now();
};

export const getStoredSession = (): AuthSession | null => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const session = JSON.parse(raw) as AuthSession;
    if (
      !session.token ||
      !session.tenantId ||
      (session.user?.tenantId && session.user.tenantId !== session.tenantId)
    ) {
      clearSession();
      return null;
    }
    if (isExpired(session)) {
      clearSession();
      return null;
    }
    return session;
  } catch {
    clearSession();
    return null;
  }
};

export const saveSession = (token: string, tenantId: string): AuthSession => {
  const user = decodeJwtPayload(token);
  if (user?.tenantId && user.tenantId !== tenantId) {
    throw new Error("Tenant identity mismatch");
  }

  const resolvedTenantId = user?.tenantId || tenantId;
  if (!resolvedTenantId) {
    throw new Error("Tenant identity missing from session");
  }

  const session: AuthSession = {
    token,
    tenantId: resolvedTenantId,
    user,
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  return session;
};

export const clearSession = () => {
  localStorage.removeItem(STORAGE_KEY);
};

export const notifySessionExpired = () => {
  window.dispatchEvent(new Event("commerce360:session-expired"));
};
