import { type FormEvent, useCallback, useEffect, useState } from "react";
import { ArrowLeft, BadgePercent, Plus, RefreshCw, Trash2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { ecommerceApi } from "../../lib/api";
import type { Campaign, Category, Product } from "../../types";
import { confirmAction, date, getErrorMessage } from "../../shared/utils";
import { EmptyState, ErrorBanner, StatusPill } from "../../shared/ui/feedback";
import { DataPage, PanelTitle } from "../../shared/ui/page";

const toggleValue = (values: string[], value: string) =>
  values.includes(value)
    ? values.filter((item) => item !== value)
    : [...values, value];

export function Campaigns() {
  const [rows, setRows] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await ecommerceApi.campaigns();
      setRows(response.rows);
    } catch (err) {
      setError(getErrorMessage(err, "Campaigns failed to load"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const toggle = async (row: Campaign) => {
    try {
      await ecommerceApi.updateCampaign(row._id, {
        isActive: row.isActive === false,
      });
      await load();
    } catch (err) {
      setError(getErrorMessage(err, "Campaign could not be updated"));
    }
  };

  const remove = async (id: string) => {
    if (!confirmAction("Delete this campaign?")) return;
    try {
      await ecommerceApi.deleteCampaign(id);
      await load();
    } catch (err) {
      setError(getErrorMessage(err, "Campaign could not be deleted"));
    }
  };

  return (
    <DataPage
      title="Campaigns"
      detail="Scheduled promotions, storefront stories, and validated checkout codes"
      actions={
        <div className="filters">
          <button className="ghost-button" type="button" onClick={() => void load()}>
            <RefreshCw size={16} />
            Refresh
          </button>
          <Link className="primary-button" to="/campaigns/new">
            <Plus size={16} />
            New campaign
          </Link>
        </div>
      }
    >
      {error && <ErrorBanner message={error} />}
      <div className="table-card">
        <table>
          <thead>
            <tr>
              <th>Campaign</th>
              <th>Offer</th>
              <th>Schedule</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row._id}>
                <td>
                  <strong>{row.name}</strong>
                  <span className="muted-block">
                    {row.code ? `Code ${row.code}` : `/${row.slug}`}
                  </span>
                </td>
                <td>
                  {row.discountValue}
                  {row.discountType === "percentage" ? "%" : " fixed"}
                  <span className="muted-block">
                    {row.minimumSpend ? `Minimum ${row.minimumSpend}` : "No minimum"}
                  </span>
                </td>
                <td>
                  {date(row.startsAt)}
                  <span className="muted-block">to {date(row.endsAt)}</span>
                </td>
                <td>
                  <StatusPill status={row.isActive === false ? "inactive" : "active"} />
                </td>
                <td>
                  <div className="row-actions">
                    <button
                      className="ghost-button small"
                      type="button"
                      onClick={() => void toggle(row)}
                    >
                      {row.isActive === false ? "Activate" : "Disable"}
                    </button>
                    <button
                      className="icon-button danger"
                      type="button"
                      aria-label="Delete campaign"
                      onClick={() => void remove(row._id)}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!loading && rows.length === 0 && (
          <EmptyState
            title="No campaigns"
            detail="Schedule a promotion and optionally issue a checkout code."
          />
        )}
        {loading && <p className="table-note">Loading campaigns...</p>}
      </div>
    </DataPage>
  );
}

const toLocalDateTime = (dateValue: Date) => {
  const offset = dateValue.getTimezoneOffset() * 60_000;
  return new Date(dateValue.getTime() - offset).toISOString().slice(0, 16);
};

export function CampaignCreatePage() {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const nextWeek = new Date(Date.now() + 8 * 24 * 60 * 60 * 1000);
  const [form, setForm] = useState({
    name: "",
    slug: "",
    description: "",
    badge: "",
    image: "",
    code: "",
    discountType: "percentage" as "percentage" | "fixed",
    discountValue: "10",
    minimumSpend: "0",
    maximumDiscount: "",
    tags: "",
    startsAt: toLocalDateTime(tomorrow),
    endsAt: toLocalDateTime(nextWeek),
    priority: "0",
    isFeatured: true,
    isActive: true,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([ecommerceApi.products({ status: "active" }), ecommerceApi.categories()])
      .then(([productResult, categoryResult]) => {
        setProducts(productResult.rows);
        setCategories(categoryResult.rows);
      })
      .catch((err) => setError(getErrorMessage(err, "Product selectors failed to load")));
  }, []);

  const field = (key: keyof typeof form, value: string | boolean) =>
    setForm((current) => ({ ...current, [key]: value }));

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      await ecommerceApi.createCampaign({
        name: form.name,
        slug: form.slug,
        description: form.description || undefined,
        badge: form.badge || undefined,
        image: form.image || undefined,
        code: form.code || undefined,
        discountType: form.discountType,
        discountValue: Number(form.discountValue),
        minimumSpend: Number(form.minimumSpend),
        maximumDiscount: form.maximumDiscount
          ? Number(form.maximumDiscount)
          : undefined,
        productIds: selectedProducts,
        categoryIds: selectedCategories,
        tags: form.tags
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
        startsAt: new Date(form.startsAt).toISOString(),
        endsAt: new Date(form.endsAt).toISOString(),
        priority: Number(form.priority),
        isFeatured: form.isFeatured,
        isActive: form.isActive,
      });
      navigate("/campaigns");
    } catch (err) {
      setError(getErrorMessage(err, "Campaign could not be created"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <DataPage
      title="Create campaign"
      detail="Schedule a storefront promotion with a server-validated discount"
      actions={
        <Link className="ghost-button" to="/campaigns">
          <ArrowLeft size={16} />
          Campaign list
        </Link>
      }
    >
      {error && <ErrorBanner message={error} />}
      <section className="panel admin-form-panel create-form-panel">
        <PanelTitle title="Campaign setup" detail="Offer, schedule, audience, and products" />
        <form className="admin-form compact-form" onSubmit={submit}>
          <label>
            Name
            <input
              value={form.name}
              onChange={(event) => field("name", event.target.value)}
              required
            />
          </label>
          <label>
            Slug
            <input
              value={form.slug}
              onChange={(event) => field("slug", event.target.value)}
              placeholder="summer-savings"
              pattern="[A-Za-z0-9-]+"
              required
            />
          </label>
          <label>
            Badge
            <input
              value={form.badge}
              onChange={(event) => field("badge", event.target.value)}
              placeholder="Limited time"
            />
          </label>
          <label>
            Checkout code
            <input
              value={form.code}
              onChange={(event) => field("code", event.target.value)}
              placeholder="SAVE10"
            />
          </label>
          <label>
            Discount type
            <select
              value={form.discountType}
              onChange={(event) => field("discountType", event.target.value)}
            >
              <option value="percentage">Percentage</option>
              <option value="fixed">Fixed amount</option>
            </select>
          </label>
          <label>
            Discount value
            <input
              type="number"
              min="0.01"
              step="0.01"
              value={form.discountValue}
              onChange={(event) => field("discountValue", event.target.value)}
              required
            />
          </label>
          <label>
            Minimum spend
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.minimumSpend}
              onChange={(event) => field("minimumSpend", event.target.value)}
            />
          </label>
          <label>
            Maximum discount
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.maximumDiscount}
              onChange={(event) => field("maximumDiscount", event.target.value)}
              placeholder="Optional"
            />
          </label>
          <label>
            Starts
            <input
              type="datetime-local"
              value={form.startsAt}
              onChange={(event) => field("startsAt", event.target.value)}
              required
            />
          </label>
          <label>
            Ends
            <input
              type="datetime-local"
              value={form.endsAt}
              onChange={(event) => field("endsAt", event.target.value)}
              required
            />
          </label>
          <label className="form-wide">
            Campaign image URL
            <input
              type="url"
              value={form.image}
              onChange={(event) => field("image", event.target.value)}
              placeholder="https://..."
            />
          </label>
          <label className="form-wide">
            Description
            <textarea
              rows={3}
              value={form.description}
              onChange={(event) => field("description", event.target.value)}
            />
          </label>
          <label className="form-wide">
            Dynamic tags
            <input
              value={form.tags}
              onChange={(event) => field("tags", event.target.value)}
              placeholder="sale, seasonal, organic"
            />
          </label>
          <div className="form-wide selector-section">
            <strong>Products</strong>
            <span>Products shown on the campaign page</span>
            <div className="selector-grid">
              {products.map((product) => (
                <label className="selector-option" key={product._id}>
                  <input
                    type="checkbox"
                    checked={selectedProducts.includes(product._id)}
                    onChange={() =>
                      setSelectedProducts((current) =>
                        toggleValue(current, product._id),
                      )
                    }
                  />
                  {product.name}
                </label>
              ))}
            </div>
          </div>
          <div className="form-wide selector-section">
            <strong>Categories</strong>
            <span>Include active products from matching categories</span>
            <div className="selector-grid">
              {categories.map((category) => (
                <label className="selector-option" key={category._id}>
                  <input
                    type="checkbox"
                    checked={selectedCategories.includes(category._id)}
                    onChange={() =>
                      setSelectedCategories((current) =>
                        toggleValue(current, category._id),
                      )
                    }
                  />
                  {category.name}
                </label>
              ))}
            </div>
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
            <BadgePercent size={16} />
            {saving ? "Creating..." : "Create campaign"}
          </button>
        </form>
      </section>
    </DataPage>
  );
}

