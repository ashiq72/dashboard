import { useState } from "react";
import { RefreshCw } from "lucide-react";
import { getTenantId, healthCheck } from "../../lib/api";
import { useAuth } from "../../app/auth-context";
import { useTenant } from "../../app/tenant-context";
import { date, getErrorMessage } from "../../shared/utils";
import { ErrorBanner, StatusPill } from "../../shared/ui/feedback";
import { DataPage, PanelTitle } from "../../shared/ui/page";
import { TenantDomainsPanel } from "./TenantDomainsPanel";

function HealthCheckPanel() {
  const [checking, setChecking] = useState(false);
  const [message, setMessage] = useState("Not checked yet");
  const [healthy, setHealthy] = useState<boolean | null>(null);

  const check = async () => {
    setChecking(true);
    setHealthy(null);
    try {
      const response = await healthCheck();
      setHealthy(true);
      setMessage(
        response.data?.timestamp
          ? `Online at ${date(response.data.timestamp)}`
          : "Base360 API is online",
      );
    } catch (err) {
      setHealthy(false);
      setMessage(getErrorMessage(err, "Base360 API is not reachable"));
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="panel">
      <PanelTitle title="API health" detail="Connectivity check" />
      <div className="health-row">
        <StatusPill
          status={healthy === null ? "pending" : healthy ? "active" : "failed"}
        />
        <span>{message}</span>
      </div>
      <button
        className="ghost-button"
        type="button"
        onClick={() => void check()}
        disabled={checking}
      >
        <RefreshCw size={16} />
        {checking ? "Checking..." : "Check API"}
      </button>
    </div>
  );
}

export function SettingsPage() {
  const { session } = useAuth();
  const { tenant, loading, error, refreshTenant } = useTenant();
  const unavailable = loading ? "Loading…" : "Unavailable";

  return (
    <DataPage
      title="Settings"
      detail="Workspace identity, plan, and API connection"
      actions={
        <button
          className="ghost-button"
          type="button"
          disabled={loading}
          onClick={() => void refreshTenant()}
        >
          <RefreshCw size={16} />
          {loading ? "Refreshing..." : "Refresh workspace"}
        </button>
      }
    >
      {error ? <ErrorBanner message={error} /> : null}
      <div className="settings-grid">
        <div className="panel">
          <PanelTitle title="API connection" detail="Base360 backend target" />
          <dl className="details-list">
            <div>
              <dt>API URL</dt>
              <dd>
                {import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1"}
              </dd>
            </div>
            <div>
              <dt>Internal tenant ID</dt>
              <dd>{session?.tenantId || getTenantId()}</dd>
            </div>
            <div>
              <dt>Auth mode</dt>
              <dd>Bearer token + x-tenant-id</dd>
            </div>
            <div>
              <dt>Session</dt>
              <dd>{session?.user?.role || "Authenticated"}</dd>
            </div>
          </dl>
        </div>
        <div className="panel">
          <PanelTitle
            title="SaaS workspace"
            detail="Authenticated tenant profile"
          />
          <dl className="details-list">
            <div>
              <dt>Business name</dt>
              <dd>{tenant ? tenant.name || "Not provided" : unavailable}</dd>
            </div>
            <div>
              <dt>Tenant code</dt>
              <dd>
                {tenant ? tenant.tenantCode || "Not assigned yet" : unavailable}
              </dd>
            </div>
            <div>
              <dt>Status</dt>
              <dd>
                {tenant ? <StatusPill status={tenant.status} /> : unavailable}
              </dd>
            </div>
            <div>
              <dt>Plan</dt>
              <dd>{tenant ? tenant.plan || "Not configured" : unavailable}</dd>
            </div>
            <div>
              <dt>Hostname</dt>
              <dd>
                {tenant ? tenant.domain || "Not configured" : unavailable}
              </dd>
            </div>
            <div>
              <dt>Root domain</dt>
              <dd>
                {tenant ? tenant.rootDomain || "Not configured" : unavailable}
              </dd>
            </div>
            <div>
              <dt>Domain name</dt>
              <dd>
                {tenant ? tenant.domainName || "Not configured" : unavailable}
              </dd>
            </div>
            <div>
              <dt>Subdomain</dt>
              <dd>
                {tenant
                  ? tenant.subdomain ||
                    (tenant.domain ? "None (root domain)" : "Not configured")
                  : unavailable}
              </dd>
            </div>
            <div>
              <dt>Address</dt>
              <dd>
                {tenant
                  ? (tenant.address === undefined
                      ? tenant.region
                      : tenant.address) || "Not provided"
                  : unavailable}
              </dd>
            </div>
          </dl>
          <p className="table-note">
            Tenant ID and code stay the same when domains change. Contact your
            platform administrator to update the address or plan.
          </p>
        </div>
        <HealthCheckPanel />
        <div className="panel">
          <PanelTitle
            title="Recommended backend modules"
            detail="Already detected in base360"
          />
          <div className="module-list">
            {[
              "Products",
              "Orders",
              "Categories",
              "Warehouses",
              "Branding",
              "Sliders",
            ].map((module) => (
              <span key={module}>{module}</span>
            ))}
          </div>
        </div>
      </div>
      {tenant &&
      ["admin", "super_admin"].includes(session?.user?.role || "") ? (
        <TenantDomainsPanel
          key={tenant.tenantId}
          tenantId={tenant.tenantId}
          onChange={refreshTenant}
        />
      ) : null}
    </DataPage>
  );
}
