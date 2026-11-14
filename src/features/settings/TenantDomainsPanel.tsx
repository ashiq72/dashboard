import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";
import { Globe2, RefreshCw, ShieldCheck } from "lucide-react";
import { ecommerceApi } from "../../lib/api";
import type { TenantDomain } from "../../types";
import { getErrorMessage } from "../../shared/utils";
import { ErrorBanner, StatusPill } from "../../shared/ui/feedback";
import { PanelTitle } from "../../shared/ui/page";
import "./tenant-domains.css";

export function TenantDomainsPanel({
  tenantId,
  onChange,
}: {
  tenantId: string;
  onChange: () => Promise<void>;
}) {
  const [domains, setDomains] = useState<TenantDomain[]>([]);
  const [hostname, setHostname] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [removing, setRemoving] = useState<string | null>(null);
  const generation = useRef(0);

  const refresh = useCallback(async () => {
    const current = ++generation.current;
    setLoading(true);
    setError("");
    try {
      const response = await ecommerceApi.tenantDomains(tenantId);
      if (current === generation.current) setDomains(response.data);
    } catch (err) {
      if (current === generation.current)
        setError(
          getErrorMessage(err, "Could not load domains. Try refreshing."),
        );
    } finally {
      if (current === generation.current) setLoading(false);
    }
  }, [tenantId]);

  useEffect(() => {
    void refresh();
    return () => {
      generation.current++;
    };
  }, [refresh]);

  const act = async (action: () => Promise<unknown>, message: string) => {
    if (busy || loading) return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await action();
      setNotice(message);
      setRemoving(null);
      await refresh();
      await onChange();
    } catch (err) {
      setError(getErrorMessage(err, "The domain could not be updated."));
    } finally {
      setBusy(false);
    }
  };

  const add = (event: FormEvent) => {
    event.preventDefault();
    const value = hostname.trim().toLowerCase();
    if (!value) return;
    void act(async () => {
      await ecommerceApi.addTenantDomain(tenantId, value);
      setHostname("");
    }, "Domain added. Create the TXT record below and verify ownership.");
  };

  return (
    <section className="panel tenant-domains-panel">
      <PanelTitle
        title="Domains and website onboarding"
        detail="Connect a hostname to this store without changing its tenant ID."
      />
      <div className="tenant-onboarding-note">
        <ShieldCheck size={18} />
        <p>
          Add the full hostname, prove ownership with its TXT record, then point
          its A/AAAA/CNAME records to your storefront host and enable HTTPS
          there. DNS verification approves routing in Base360; it does not
          configure hosting or issue a certificate.
        </p>
      </div>
      <form onSubmit={add} className="tenant-domain-add">
        <label htmlFor="workspace-domain">Full hostname</label>
        <div>
          <input
            id="workspace-domain"
            value={hostname}
            onChange={(event) => setHostname(event.target.value)}
            placeholder="shop.example.com"
            autoCapitalize="none"
            autoComplete="off"
            spellCheck={false}
            disabled={busy || loading}
            required
          />
          <button
            type="submit"
            className="primary-button"
            disabled={busy || loading || !hostname.trim()}
          >
            <Globe2 size={16} />
            Connect domain
          </button>
        </div>
        <small>
          Use no https:// or path. Add example.com and www.example.com
          separately if both should work.
        </small>
      </form>
      <div className="tenant-domain-toolbar">
        <span>
          {
            domains.filter((domain) => domain.verificationStatus === "verified")
              .length
          }{" "}
          verified hostname(s)
        </span>
        <button
          className="ghost-button"
          type="button"
          disabled={busy || loading}
          onClick={() => void refresh()}
        >
          <RefreshCw size={14} />
          {loading ? "Refreshing…" : "Refresh domains"}
        </button>
      </div>
      {error && <ErrorBanner message={error} />}
      {notice && (
        <p className="tenant-domain-notice" role="status">
          {notice}
        </p>
      )}
      {!loading && !error && domains.length === 0 && (
        <p>No domains connected yet. Add your first hostname above.</p>
      )}
      <div className="tenant-domain-list">
        {domains.map((domain) => (
          <article key={domain._id} className="tenant-domain-record">
            <header>
              <div>
                <h4>{domain.hostname}</h4>
                <p>
                  Root: {domain.rootDomain} · Subdomain:{" "}
                  {domain.subdomain || "None"}
                </p>
              </div>
              <div className="tenant-domain-badges">
                <StatusPill status={domain.verificationStatus} />
                {domain.isPrimary && (
                  <span className="tenant-primary-label">Primary</span>
                )}
              </div>
            </header>
            {domain.verificationStatus === "pending" &&
              domain.verificationRecord && (
                <div className="tenant-dns-record">
                  <p>Add this DNS TXT record with your domain provider:</p>
                  <dl>
                    <div>
                      <dt>Type</dt>
                      <dd>TXT</dd>
                    </div>
                    <div>
                      <dt>Name</dt>
                      <dd>
                        <code>{domain.verificationRecord.name}</code>
                      </dd>
                    </div>
                    <div>
                      <dt>Value</dt>
                      <dd>
                        <code>{domain.verificationRecord.value}</code>
                      </dd>
                    </div>
                  </dl>
                  <small>
                    Some providers append your domain automatically. DNS changes
                    can take time to appear.
                  </small>
                </div>
              )}
            <div className="tenant-domain-actions">
              {domain.verificationStatus === "pending" && (
                <button
                  type="button"
                  className="primary-button"
                  disabled={busy || loading}
                  onClick={() =>
                    void act(
                      () =>
                        ecommerceApi.verifyTenantDomain(tenantId, domain._id),
                      `${domain.hostname} ownership verified.`,
                    )
                  }
                >
                  Verify DNS
                </button>
              )}
              {domain.verificationStatus === "verified" &&
                !domain.isPrimary && (
                  <button
                    type="button"
                    className="ghost-button"
                    disabled={busy || loading}
                    onClick={() =>
                      void act(
                        () =>
                          ecommerceApi.primaryTenantDomain(
                            tenantId,
                            domain._id,
                          ),
                        `${domain.hostname} is now primary.`,
                      )
                    }
                  >
                    Make primary
                  </button>
                )}
              <button
                type="button"
                className="ghost-button"
                disabled={busy || loading}
                onClick={() => setRemoving(domain._id)}
              >
                Disconnect
              </button>
            </div>
            {removing === domain._id && (
              <div className="tenant-domain-confirm">
                <p>
                  Disconnect {domain.hostname}? Visitors using it will no longer
                  reach this store through Base360.
                  {domain.isPrimary
                    ? " Another verified hostname will become primary if available."
                    : ""}
                </p>
                <div>
                  <button
                    type="button"
                    className="ghost-button"
                    disabled={busy || loading}
                    onClick={() =>
                      void act(
                        () =>
                          ecommerceApi.removeTenantDomain(tenantId, domain._id),
                        "Domain disconnected.",
                      )
                    }
                  >
                    Confirm disconnect
                  </button>
                  <button
                    type="button"
                    className="ghost-button"
                    disabled={busy}
                    onClick={() => setRemoving(null)}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}
