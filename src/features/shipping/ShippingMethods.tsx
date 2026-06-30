import { type FormEvent, useCallback, useEffect, useState } from "react";
import { ArrowLeft, Plus, RefreshCw, Trash2, Truck } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { ecommerceApi } from "../../lib/api";
import type { ShippingMethod } from "../../types";
import { confirmAction, getErrorMessage, money } from "../../shared/utils";
import { EmptyState, ErrorBanner, StatusPill } from "../../shared/ui/feedback";
import { DataPage, PanelTitle } from "../../shared/ui/page";

export function ShippingMethods() {
  const [rows, setRows] = useState<ShippingMethod[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await ecommerceApi.shippingMethods();
      setRows(response.rows);
    } catch (err) {
      setError(getErrorMessage(err, "Shipping methods failed to load"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const toggle = async (row: ShippingMethod) => {
    try {
      await ecommerceApi.updateShippingMethod(row._id, {
        isActive: row.isActive === false,
      });
      await load();
    } catch (err) {
      setError(getErrorMessage(err, "Shipping method could not be updated"));
    }
  };

  const remove = async (id: string) => {
    if (!confirmAction("Delete this shipping method?")) return;
    try {
      await ecommerceApi.deleteShippingMethod(id);
      await load();
    } catch (err) {
      setError(getErrorMessage(err, "Shipping method could not be deleted"));
    }
  };

  return (
    <DataPage
      title="Shipping methods"
      detail="Delivery services, coverage, pricing, and customer estimates"
      actions={
        <div className="filters">
          <button className="ghost-button" type="button" onClick={() => void load()}>
            <RefreshCw size={16} />
            Refresh
          </button>
          <Link className="primary-button" to="/shipping/new">
            <Plus size={16} />
            New method
          </Link>
        </div>
      }
    >
      {error && <ErrorBanner message={error} />}
      <div className="table-card">
        <table>
          <thead>
            <tr>
              <th>Method</th>
              <th>Coverage</th>
              <th>Price</th>
              <th>Estimate</th>
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
                    {[row.carrier, row.service].filter(Boolean).join(" / ") ||
                      row.code}
                  </span>
                </td>
                <td>{row.countries?.length ? row.countries.join(", ") : "Worldwide"}</td>
                <td>
                  <strong>{money(row.price)}</strong>
                  <span className="muted-block">
                    {row.freeAbove !== undefined
                      ? `Free above ${money(row.freeAbove)}`
                      : "Flat rate"}
                  </span>
                </td>
                <td>
                  {row.minDeliveryDays}-{row.maxDeliveryDays} business days
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
                      aria-label="Delete shipping method"
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
            title="No shipping methods"
            detail="Create at least one method before accepting storefront orders."
          />
        )}
        {loading && <p className="table-note">Loading shipping methods...</p>}
      </div>
    </DataPage>
  );
}

export function ShippingCreatePage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    code: "",
    description: "",
    carrier: "",
    service: "",
    countries: "",
    price: "0",
    freeAbove: "",
    minDeliveryDays: "1",
    maxDeliveryDays: "3",
    priority: "0",
    isActive: true,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const field = (key: keyof typeof form, value: string | boolean) =>
    setForm((current) => ({ ...current, [key]: value }));

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      await ecommerceApi.createShippingMethod({
        name: form.name,
        code: form.code,
        description: form.description || undefined,
        carrier: form.carrier || undefined,
        service: form.service || undefined,
        countries: form.countries
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
        price: Number(form.price),
        freeAbove: form.freeAbove ? Number(form.freeAbove) : undefined,
        minDeliveryDays: Number(form.minDeliveryDays),
        maxDeliveryDays: Number(form.maxDeliveryDays),
        priority: Number(form.priority),
        isActive: form.isActive,
      });
      navigate("/shipping");
    } catch (err) {
      setError(getErrorMessage(err, "Shipping method could not be created"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <DataPage
      title="Create shipping method"
      detail="Define a delivery promise the checkout can safely price"
      actions={
        <Link className="ghost-button" to="/shipping">
          <ArrowLeft size={16} />
          Shipping list
        </Link>
      }
    >
      {error && <ErrorBanner message={error} />}
      <section className="panel admin-form-panel create-form-panel">
        <PanelTitle title="Method details" detail="Coverage, cost, and delivery window" />
        <form className="admin-form compact-form" onSubmit={submit}>
          <label>
            Method name
            <input
              value={form.name}
              onChange={(event) => field("name", event.target.value)}
              placeholder="Dhaka express"
              required
            />
          </label>
          <label>
            Code
            <input
              value={form.code}
              onChange={(event) => field("code", event.target.value)}
              placeholder="dhaka-express"
              pattern="[A-Za-z0-9-]+"
              required
            />
          </label>
          <label>
            Carrier
            <input
              value={form.carrier}
              onChange={(event) => field("carrier", event.target.value)}
              placeholder="Pathao"
            />
          </label>
          <label>
            Service
            <input
              value={form.service}
              onChange={(event) => field("service", event.target.value)}
              placeholder="Next day"
            />
          </label>
          <label className="form-wide">
            Countries
            <input
              value={form.countries}
              onChange={(event) => field("countries", event.target.value)}
              placeholder="Bangladesh, India (leave empty for worldwide)"
            />
          </label>
          <label>
            Price
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.price}
              onChange={(event) => field("price", event.target.value)}
              required
            />
          </label>
          <label>
            Free above
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.freeAbove}
              onChange={(event) => field("freeAbove", event.target.value)}
              placeholder="Optional"
            />
          </label>
          <label>
            Minimum days
            <input
              type="number"
              min="0"
              value={form.minDeliveryDays}
              onChange={(event) => field("minDeliveryDays", event.target.value)}
              required
            />
          </label>
          <label>
            Maximum days
            <input
              type="number"
              min="0"
              value={form.maxDeliveryDays}
              onChange={(event) => field("maxDeliveryDays", event.target.value)}
              required
            />
          </label>
          <label className="form-wide">
            Description
            <textarea
              value={form.description}
              onChange={(event) => field("description", event.target.value)}
              rows={3}
              placeholder="Shown to customers while choosing delivery"
            />
          </label>
          <label className="check-row">
            <input
              checked={form.isActive}
              onChange={(event) => field("isActive", event.target.checked)}
              type="checkbox"
            />
            Available at checkout
          </label>
          <button className="primary-button form-submit" type="submit" disabled={saving}>
            <Truck size={16} />
            {saving ? "Creating..." : "Create method"}
          </button>
        </form>
      </section>
    </DataPage>
  );
}

