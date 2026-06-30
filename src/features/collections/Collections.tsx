import { type FormEvent, useCallback, useEffect, useState } from "react";
import { ArrowLeft, Layers3, Plus, RefreshCw, Trash2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { ecommerceApi } from "../../lib/api";
import type { Category, Collection, Product } from "../../types";
import { confirmAction, getErrorMessage } from "../../shared/utils";
import { EmptyState, ErrorBanner, StatusPill } from "../../shared/ui/feedback";
import { DataPage, PanelTitle } from "../../shared/ui/page";

const toggleValue = (values: string[], value: string) =>
  values.includes(value)
    ? values.filter((item) => item !== value)
    : [...values, value];

export function Collections() {
  const [rows, setRows] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await ecommerceApi.collections();
      setRows(response.rows);
    } catch (err) {
      setError(getErrorMessage(err, "Collections failed to load"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const toggle = async (row: Collection) => {
    try {
      await ecommerceApi.updateCollection(row._id, {
        isActive: row.isActive === false,
      });
      await load();
    } catch (err) {
      setError(getErrorMessage(err, "Collection could not be updated"));
    }
  };

  const remove = async (id: string) => {
    if (!confirmAction("Delete this collection?")) return;
    try {
      await ecommerceApi.deleteCollection(id);
      await load();
    } catch (err) {
      setError(getErrorMessage(err, "Collection could not be deleted"));
    }
  };

  return (
    <DataPage
      title="Collections"
      detail="Curated product groups for storefront discovery and merchandising"
      actions={
        <div className="filters">
          <button className="ghost-button" type="button" onClick={() => void load()}>
            <RefreshCw size={16} />
            Refresh
          </button>
          <Link className="primary-button" to="/collections/new">
            <Plus size={16} />
            New collection
          </Link>
        </div>
      }
    >
      {error && <ErrorBanner message={error} />}
      <div className="table-card">
        <table>
          <thead>
            <tr>
              <th>Collection</th>
              <th>Rules</th>
              <th>Placement</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row._id}>
                <td>
                  <strong>{row.name}</strong>
                  <span className="muted-block">/{row.slug}</span>
                </td>
                <td>
                  {(row.productIds?.length || 0) +
                    (row.categoryIds?.length || 0) +
                    (row.tags?.length || 0)}{" "}
                  selectors
                </td>
                <td>{row.isFeatured ? "Featured" : "Standard"}</td>
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
                      aria-label="Delete collection"
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
            title="No collections"
            detail="Group products into useful buying stories for your customers."
          />
        )}
        {loading && <p className="table-note">Loading collections...</p>}
      </div>
    </DataPage>
  );
}

export function CollectionCreatePage() {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [form, setForm] = useState({
    name: "",
    slug: "",
    description: "",
    image: "",
    tags: "",
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
      await ecommerceApi.createCollection({
        name: form.name,
        slug: form.slug,
        description: form.description || undefined,
        image: form.image || undefined,
        productIds: selectedProducts,
        categoryIds: selectedCategories,
        tags: form.tags
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
        priority: Number(form.priority),
        isFeatured: form.isFeatured,
        isActive: form.isActive,
      });
      navigate("/collections");
    } catch (err) {
      setError(getErrorMessage(err, "Collection could not be created"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <DataPage
      title="Create collection"
      detail="Curate products directly or build a dynamic group with categories and tags"
      actions={
        <Link className="ghost-button" to="/collections">
          <ArrowLeft size={16} />
          Collection list
        </Link>
      }
    >
      {error && <ErrorBanner message={error} />}
      <section className="panel admin-form-panel create-form-panel">
        <PanelTitle title="Collection identity" detail="Storefront title, media, and rules" />
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
              placeholder="weekly-essentials"
              pattern="[A-Za-z0-9-]+"
              required
            />
          </label>
          <label className="form-wide">
            Image URL
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
              placeholder="organic, breakfast, new"
            />
          </label>
          <div className="form-wide selector-section">
            <strong>Products</strong>
            <span>Select exact products to include</span>
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
            <span>Automatically include matching active products</span>
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
          <label>
            Priority
            <input
              type="number"
              value={form.priority}
              onChange={(event) => field("priority", event.target.value)}
            />
          </label>
          <div className="form-flags">
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
            <Layers3 size={16} />
            {saving ? "Creating..." : "Create collection"}
          </button>
        </form>
      </section>
    </DataPage>
  );
}

