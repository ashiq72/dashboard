import { type FormEvent, useCallback, useEffect, useState } from "react";
import {
  ArrowLeft,
  BadgeCheck,
  Plus,
  RefreshCw,
  Star,
  Trash2,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { ecommerceApi } from "../../lib/api";
import type { Brand, BrandPayload } from "../../types";
import {
  confirmAction,
  getErrorMessage,
} from "../../shared/utils";
import {
  EmptyState,
  ErrorBanner,
  StatusPill,
} from "../../shared/ui/feedback";
import { DataPage, PanelTitle } from "../../shared/ui/page";
import { ImageUploadField } from "../../shared/ui/ImageUploadField";

export function Brands() {
  const [rows, setRows] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await ecommerceApi.brands();
      setRows(response.rows);
    } catch (err) {
      setError(getErrorMessage(err, "Brands failed to load"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const toggleActive = async (brand: Brand) => {
    setError("");
    try {
      await ecommerceApi.updateBrand(brand._id, {
        isActive: brand.isActive === false,
      });
      await load();
    } catch (err) {
      setError(getErrorMessage(err, "Brand status could not be updated"));
    }
  };

  const toggleFeatured = async (brand: Brand) => {
    setError("");
    try {
      await ecommerceApi.updateBrand(brand._id, {
        isFeatured: !brand.isFeatured,
      });
      await load();
    } catch (err) {
      setError(getErrorMessage(err, "Brand placement could not be updated"));
    }
  };

  const remove = async (id: string) => {
    if (!confirmAction("Delete this brand? Products keep their current brand text.")) {
      return;
    }
    setError("");
    try {
      await ecommerceApi.deleteBrand(id);
      await load();
    } catch (err) {
      setError(getErrorMessage(err, "Brand could not be deleted"));
    }
  };

  return (
    <DataPage
      title="Brands"
      detail="Manage product makers, logos, and storefront discovery"
      actions={
        <div className="filters">
          <button className="ghost-button" type="button" onClick={() => void load()}>
            <RefreshCw size={16} />
            Refresh
          </button>
          <Link className="primary-button" to="/brands/new">
            <Plus size={16} />
            New brand
          </Link>
        </div>
      }
    >
      {error ? <ErrorBanner message={error} /> : null}
      <div className="table-card">
        <table>
          <thead>
            <tr>
              <th>Brand</th>
              <th>Website</th>
              <th>Placement</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((brand) => (
              <tr key={brand._id}>
                <td>
                  <div className="brand-table-name">
                    <span className="brand-table-logo">
                      {brand.logo ? (
                        <img src={brand.logo} alt="" />
                      ) : (
                        brand.name.slice(0, 1).toUpperCase()
                      )}
                    </span>
                    <span>
                      <strong>{brand.name}</strong>
                      <small>/{brand.slug}</small>
                    </span>
                  </div>
                </td>
                <td>
                  {brand.website ? (
                    <a href={brand.website} target="_blank" rel="noreferrer">
                      {brand.website.replace(/^https?:\/\//, "")}
                    </a>
                  ) : (
                    "Not set"
                  )}
                </td>
                <td>
                  <StatusPill
                    status={brand.isFeatured ? "featured" : "standard"}
                  />
                </td>
                <td>
                  <StatusPill
                    status={brand.isActive === false ? "inactive" : "active"}
                  />
                </td>
                <td>
                  <div className="row-actions">
                    <button
                      className="icon-button"
                      type="button"
                      onClick={() => void toggleFeatured(brand)}
                      aria-label={
                        brand.isFeatured ? "Remove from featured" : "Feature brand"
                      }
                      title={
                        brand.isFeatured ? "Remove from featured" : "Feature brand"
                      }
                    >
                      <Star
                        size={16}
                        fill={brand.isFeatured ? "currentColor" : "none"}
                      />
                    </button>
                    <button
                      className="ghost-button small"
                      type="button"
                      onClick={() => void toggleActive(brand)}
                    >
                      {brand.isActive === false ? "Activate" : "Disable"}
                    </button>
                    <button
                      className="icon-button danger"
                      type="button"
                      onClick={() => void remove(brand._id)}
                      aria-label="Delete brand"
                      title="Delete brand"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!loading && rows.length === 0 ? (
          <EmptyState
            title="No brands yet"
            detail="Create brands to make product assignment and storefront browsing easier."
          />
        ) : null}
        {loading ? <p className="table-note">Loading brands...</p> : null}
      </div>
    </DataPage>
  );
}

export function BrandCreatePage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    slug: "",
    description: "",
    website: "",
    coverImage: "",
    priority: "0",
    isFeatured: true,
    isActive: true,
  });
  const [logoFiles, setLogoFiles] = useState<File[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const field = (key: keyof typeof form, value: string | boolean) =>
    setForm((current) => ({ ...current, [key]: value }));

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const payload: BrandPayload = {
        name: form.name.trim(),
        slug: form.slug.trim() || undefined,
        description: form.description.trim() || undefined,
        website: form.website.trim() || undefined,
        coverImage: form.coverImage.trim() || undefined,
        priority: Number(form.priority) || 0,
        isFeatured: form.isFeatured,
        isActive: form.isActive,
      };

      if (logoFiles[0]) {
        const data = new FormData();
        Object.entries(payload).forEach(([key, value]) => {
          if (value !== undefined) data.set(key, String(value));
        });
        data.set("logo", logoFiles[0]);
        await ecommerceApi.createBrandForm(data);
      } else {
        await ecommerceApi.createBrand(payload);
      }
      navigate("/brands");
    } catch (err) {
      setError(getErrorMessage(err, "Brand could not be created"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <DataPage
      title="Create brand"
      detail="Add a reusable product brand and storefront identity"
      actions={
        <Link className="ghost-button" to="/brands">
          <ArrowLeft size={16} />
          Brand list
        </Link>
      }
    >
      {error ? <ErrorBanner message={error} /> : null}
      <section className="panel admin-form-panel create-form-panel">
        <PanelTitle
          title="Brand identity"
          detail="Name, logo, destination, and storefront placement"
        />
        <form className="admin-form compact-form" onSubmit={submit}>
          <label>
            Brand name
            <input
              value={form.name}
              onChange={(event) => field("name", event.target.value)}
              placeholder="Acme"
              required
            />
          </label>
          <label>
            Slug
            <input
              value={form.slug}
              onChange={(event) =>
                field(
                  "slug",
                  event.target.value
                    .toLowerCase()
                    .replace(/[^a-z0-9-]/g, "-"),
                )
              }
              placeholder="Generated from name"
              pattern="[a-z0-9-]+"
            />
          </label>
          <label>
            Priority
            <input
              type="number"
              value={form.priority}
              onChange={(event) => field("priority", event.target.value)}
            />
          </label>
          <label className="form-wide">
            Website
            <input
              type="url"
              value={form.website}
              onChange={(event) => field("website", event.target.value)}
              placeholder="https://brand.example"
            />
          </label>
          <label className="form-wide">
            Cover image URL
            <input
              type="url"
              value={form.coverImage}
              onChange={(event) => field("coverImage", event.target.value)}
              placeholder="Optional campaign-quality brand image"
            />
          </label>
          <label className="form-wide">
            Description
            <textarea
              rows={4}
              value={form.description}
              onChange={(event) => field("description", event.target.value)}
              placeholder="A concise customer-facing introduction to the brand"
            />
          </label>
          <div className="form-wide">
            <ImageUploadField
              title="Brand logo"
              files={logoFiles}
              onFilesChange={setLogoFiles}
              compact
            />
          </div>
          <div className="form-flags form-wide">
            <label className="check-row">
              <input
                type="checkbox"
                checked={form.isFeatured}
                onChange={(event) => field("isFeatured", event.target.checked)}
              />
              Feature on storefront
            </label>
            <label className="check-row">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(event) => field("isActive", event.target.checked)}
              />
              Active
            </label>
          </div>
          <button className="primary-button form-submit" type="submit" disabled={saving}>
            <BadgeCheck size={16} />
            {saving ? "Creating..." : "Create brand"}
          </button>
        </form>
      </section>
    </DataPage>
  );
}

