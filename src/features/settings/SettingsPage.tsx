import { useState } from "react";
import { RefreshCw } from "lucide-react";
import { getTenantId, healthCheck } from "../../lib/api";
import { useAuth } from "../../app/auth";
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

  return (
    <DataPage
      title="Settings"
      detail="Connection and tenant configuration"
      actions={null}
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
              <dt>Tenant header</dt>
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

