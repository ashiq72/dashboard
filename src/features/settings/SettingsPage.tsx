import { useState } from "react";
import { RefreshCw } from "lucide-react";
import { getTenantId, healthCheck } from "../../lib/api";
import { useAuth } from "../../app/auth";
import { useTenant } from "../../app/tenant";
import { date, getErrorMessage } from "../../shared/utils";
import { StatusPill } from "../../shared/ui/feedback";
import { DataPage, PanelTitle } from "../../shared/ui/page";

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
        <StatusPill status={healthy === null ? "pending" : healthy ? "active" : "failed"} />
        <span>{message}</span>
      </div>
      <button className="ghost-button" type="button" onClick={() => void check()} disabled={checking}>
        <RefreshCw size={16} />
        {checking ? "Checking..." : "Check API"}
      </button>
    </div>
  );
}

export function SettingsPage() {
  const { session } = useAuth();
  const { tenant, loading, refreshTenant } = useTenant();

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
      <div className="settings-grid">
        <div className="panel">
          <PanelTitle title="API connection" detail="Base360 backend target" />
          <dl className="details-list">
            <div>
              <dt>API URL</dt>
              <dd>{import.meta.env.VITE_API_URL || "http://localhost:4000/api/v1"}</dd>
            </div>
            <div>
              <dt>Workspace ID</dt>
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
          <PanelTitle title="SaaS workspace" detail="Authenticated tenant profile" />
          <dl className="details-list">
            <div>
              <dt>Status</dt>
              <dd>{tenant?.status || "Loading"}</dd>
            </div>
            <div>
              <dt>Plan</dt>
              <dd>{tenant?.plan || "basic"}</dd>
            </div>
            <div>
              <dt>Domain</dt>
              <dd>{tenant?.domain || tenant?.subdomain || "Not configured"}</dd>
            </div>
            <div>
              <dt>Region</dt>
              <dd>{tenant?.region || "Default"}</dd>
            </div>
          </dl>
        </div>
        <HealthCheckPanel />
        <div className="panel">
          <PanelTitle title="Recommended backend modules" detail="Already detected in base360" />
          <div className="module-list">
            {["Products", "Orders", "Categories", "Warehouses", "Branding", "Sliders"].map(
              (module) => (
                <span key={module}>{module}</span>
              ),
            )}
          </div>
        </div>
      </div>
    </DataPage>
  );
}
