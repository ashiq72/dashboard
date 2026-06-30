import { type FormEvent, useCallback, useEffect, useState } from "react";
import { ArrowLeft, Pencil, RefreshCw, Save } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { ecommerceApi } from "../../lib/api";
import { getErrorMessage } from "../../shared/utils";
import { ErrorBanner } from "../../shared/ui/feedback";
import { ImageUploadField } from "../../shared/ui/ImageUploadField";
import { DataPage, PanelTitle } from "../../shared/ui/page";

function BrandAssetPreview({
  desktop,
  mobile,
}: {
  desktop: string;
  mobile: string;
}) {
  return (
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
  );
}

export function BrandingPage() {
  const [desktop, setDesktop] = useState("");
  const [mobile, setMobile] = useState("");
  const [storeName, setStoreName] = useState("");
  const [tagline, setTagline] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await ecommerceApi.branding();
      setDesktop(response.data?.logoDesktop || "");
      setMobile(response.data?.logoMobile || "");
      setStoreName(response.data?.storeName || "");
      setTagline(response.data?.tagline || "");
    } catch (err) {
      setError(getErrorMessage(err, "Branding failed to load"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <DataPage
      title="Branding"
      detail="Current storefront logo assets"
      actions={
        <div className="filters">
          <button className="ghost-button" type="button" onClick={() => void load()}>
            <RefreshCw size={16} />
            Refresh
          </button>
          <Link className="primary-button" to="/branding/edit">
            <Pencil size={16} />
            Edit branding
          </Link>
        </div>
      }
    >
      {error && <ErrorBanner message={error} />}
      <section className="panel">
        <PanelTitle title="Brand assets" detail="Logos currently served by Base360" />
        <BrandAssetPreview desktop={desktop} mobile={mobile} />
        <dl className="details-list branding-details">
          <div>
            <dt>Store name</dt>
            <dd>{storeName || "Not configured"}</dd>
          </div>
          <div>
            <dt>Tagline</dt>
            <dd>{tagline || "Not configured"}</dd>
          </div>
        </dl>
        {loading && <p className="table-note">Loading branding...</p>}
      </section>
    </DataPage>
  );
}

export function BrandingEditPage() {
  const navigate = useNavigate();
  const [desktop, setDesktop] = useState("");
  const [mobile, setMobile] = useState("");
  const [desktopFiles, setDesktopFiles] = useState<File[]>([]);
  const [mobileFiles, setMobileFiles] = useState<File[]>([]);
  const [storeName, setStoreName] = useState("");
  const [tagline, setTagline] = useState("");
  const [announcement, setAnnouncement] = useState("");
  const [supportEmail, setSupportEmail] = useState("");
  const [supportPhone, setSupportPhone] = useState("");
  const [address, setAddress] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const response = await ecommerceApi.branding();
        setDesktop(response.data?.logoDesktop || "");
        setMobile(response.data?.logoMobile || "");
        setStoreName(response.data?.storeName || "");
        setTagline(response.data?.tagline || "");
        setAnnouncement(response.data?.announcement || "");
        setSupportEmail(response.data?.supportEmail || "");
        setSupportPhone(response.data?.supportPhone || "");
        setAddress(response.data?.address || "");
        setCurrency(response.data?.currency || "USD");
      } catch (err) {
        setError(getErrorMessage(err, "Branding failed to load"));
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, []);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      if (desktopFiles.length || mobileFiles.length) {
        const formData = new FormData();
        if (desktop) formData.set("logoDesktop", desktop);
        if (mobile) formData.set("logoMobile", mobile);
        formData.set("storeName", storeName);
        formData.set("tagline", tagline);
        formData.set("announcement", announcement);
        formData.set("supportEmail", supportEmail);
        formData.set("supportPhone", supportPhone);
        formData.set("address", address);
        formData.set("currency", currency);
        if (desktopFiles[0]) formData.set("logoDesktop", desktopFiles[0]);
        if (mobileFiles[0]) formData.set("logoMobile", mobileFiles[0]);
        await ecommerceApi.updateBrandingForm(formData);
      } else {
        await ecommerceApi.updateBranding({
          logoDesktop: desktop,
          logoMobile: mobile,
          storeName,
          tagline,
          announcement,
          supportEmail,
          supportPhone,
          address,
          currency,
        });
      }
      navigate("/branding");
    } catch (err) {
      setError(getErrorMessage(err, "Branding could not be saved"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <DataPage
      title="Edit branding"
      detail="Update the logo assets used across the storefront"
      actions={
        <Link className="ghost-button" to="/branding">
          <ArrowLeft size={16} />
          Branding overview
        </Link>
      }
    >
      {error && <ErrorBanner message={error} />}
      <div className="settings-grid">
        <section className="panel admin-form-panel">
          <PanelTitle title="Logo URLs" detail="Desktop and mobile marks" />
          <form className="admin-form single-column" onSubmit={submit}>
            <label>
              Store name
              <input
                value={storeName}
                onChange={(event) => setStoreName(event.target.value)}
                placeholder="Your storefront name"
                required
              />
            </label>
            <label>
              Tagline
              <input
                value={tagline}
                onChange={(event) => setTagline(event.target.value)}
                placeholder="A short customer promise"
              />
            </label>
            <label>
              Announcement
              <input
                value={announcement}
                onChange={(event) => setAnnouncement(event.target.value)}
                placeholder="Free delivery this week"
              />
            </label>
            <label>
              Support email
              <input
                value={supportEmail}
                onChange={(event) => setSupportEmail(event.target.value)}
                type="email"
              />
            </label>
            <label>
              Support phone
              <input
                value={supportPhone}
                onChange={(event) => setSupportPhone(event.target.value)}
              />
            </label>
            <label>
              Store address
              <input
                value={address}
                onChange={(event) => setAddress(event.target.value)}
              />
            </label>
            <label>
              Currency
              <input
                value={currency}
                onChange={(event) => setCurrency(event.target.value.toUpperCase())}
                maxLength={3}
                required
              />
            </label>
            <label>
              Desktop logo URL
              <input
                value={desktop}
                onChange={(event) => setDesktop(event.target.value)}
                type="url"
                placeholder="https://..."
              />
            </label>
            <ImageUploadField
              title="Upload desktop logo"
              files={desktopFiles}
              onFilesChange={setDesktopFiles}
              existingUrls={desktop ? [desktop] : []}
              compact
            />
            <label>
              Mobile logo URL
              <input
                value={mobile}
                onChange={(event) => setMobile(event.target.value)}
                type="url"
                placeholder="https://..."
              />
            </label>
            <ImageUploadField
              title="Upload mobile logo"
              files={mobileFiles}
              onFilesChange={setMobileFiles}
              existingUrls={mobile ? [mobile] : []}
              compact
            />
            <button className="primary-button form-submit" type="submit" disabled={saving}>
              <Save size={16} />
              {saving ? "Saving..." : "Save branding"}
            </button>
          </form>
          {loading && <p className="table-note">Loading branding...</p>}
        </section>
        <section className="panel">
          <PanelTitle title="Preview" detail="Updated storefront assets" />
          <BrandAssetPreview desktop={desktop} mobile={mobile} />
        </section>
      </div>
    </DataPage>
  );
}
