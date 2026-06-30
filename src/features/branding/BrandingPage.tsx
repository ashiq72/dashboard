import { type FormEvent, useCallback, useEffect, useState } from "react";
import { RefreshCw, Save } from "lucide-react";
import { ecommerceApi } from "../../lib/api";
import { getErrorMessage } from "../../shared/utils";
import { ErrorBanner } from "../../shared/ui/feedback";
import { DataPage, PanelTitle } from "../../shared/ui/page";

export function BrandingPage() {
  const [desktop, setDesktop] = useState("");
  const [mobile, setMobile] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await ecommerceApi.branding();
      setDesktop(response.data?.logoDesktop || "");
      setMobile(response.data?.logoMobile || "");
    } catch (err) {
      setError(getErrorMessage(err, "Branding failed to load"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const response = await ecommerceApi.updateBranding({
        logoDesktop: desktop,
        logoMobile: mobile,
      });
      setDesktop(response.data?.logoDesktop || desktop);
      setMobile(response.data?.logoMobile || mobile);
    } catch (err) {
      setError(getErrorMessage(err, "Branding could not be saved"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <DataPage
      title="Branding"
      detail="Store logo assets served by Base360"
      actions={
        <button className="ghost-button" type="button" onClick={() => void load()}>
          <RefreshCw size={16} />
          Refresh
        </button>
      }
    >
      {error && <ErrorBanner message={error} />}
      <div className="settings-grid">
        <section className="panel admin-form-panel">
          <PanelTitle title="Logo URLs" detail="Save desktop and mobile marks" />
          <form className="admin-form single-column" onSubmit={submit}>
            <label>
              Desktop logo URL
              <input
                value={desktop}
                onChange={(event) => setDesktop(event.target.value)}
                type="url"
                placeholder="https://..."
              />
            </label>
            <label>
              Mobile logo URL
              <input
                value={mobile}
                onChange={(event) => setMobile(event.target.value)}
                type="url"
                placeholder="https://..."
              />
            </label>
            <button className="primary-button form-submit" type="submit" disabled={saving}>
              <Save size={16} />
              {saving ? "Saving..." : "Save branding"}
            </button>
          </form>
          {loading && <p className="table-note">Loading branding...</p>}
        </section>
        <section className="panel">
          <PanelTitle title="Preview" detail="Current storefront assets" />
          <div className="brand-preview">
            <div>
              <span>Desktop</span>
              {desktop ? <img src={desktop} alt="" /> : <strong>No desktop logo</strong>}
            </div>
            <div>
              <span>Mobile</span>
              {mobile ? <img src={mobile} alt="" /> : <strong>No mobile logo</strong>}
            </div>
          </div>
        </section>
      </div>
    </DataPage>
  );
}

