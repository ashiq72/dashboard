import { type FormEvent, useCallback, useEffect, useState } from "react";
import { Plus, RefreshCw, Trash2 } from "lucide-react";
import { ecommerceApi } from "../../lib/api";
import type { Warehouse } from "../../types";
import { activeLabel, confirmAction, date, getErrorMessage } from "../../shared/utils";
import { EmptyState, ErrorBanner, StatusPill } from "../../shared/ui/feedback";
import { DataPage, PanelTitle } from "../../shared/ui/page";

export function Warehouses() {
  const [rows, setRows] = useState<Warehouse[]>([]);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await ecommerceApi.warehouses();
      setRows(response.rows);
    } catch (err) {
      setError(getErrorMessage(err, "Warehouses failed to load"));
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
      await ecommerceApi.createWarehouse({
        name,
        code: code || undefined,
        address: address || undefined,
        isActive: true,
      });
      setName("");
      setCode("");
      setAddress("");
      await load();
    } catch (err) {
      setError(getErrorMessage(err, "Warehouse could not be created"));
    } finally {
      setSaving(false);
    }
  };

  const toggle = async (warehouse: Warehouse) => {
    setError("");
    try {
      await ecommerceApi.updateWarehouse(warehouse._id, {
        isActive: warehouse.isActive === false,
      });
      await load();
    } catch (err) {
      setError(getErrorMessage(err, "Warehouse status could not be updated"));
    }
  };

  const remove = async (id: string) => {
    if (!confirmAction("Delete this warehouse?")) return;
    setError("");
    try {
      await ecommerceApi.deleteWarehouse(id);
      await load();
    } catch (err) {
      setError(getErrorMessage(err, "Warehouse could not be deleted"));
    }
  };

  return (
    <DataPage
      title="Warehouses"
      detail="Stock locations used by product inventory"
      actions={
        <button className="ghost-button" type="button" onClick={() => void load()}>
          <RefreshCw size={16} />
          Refresh
        </button>
      }
    >
      {error && <ErrorBanner message={error} />}
      <section className="panel admin-form-panel">
        <PanelTitle title="Add warehouse" detail="Create a fulfillment location" />
        <form className="admin-form compact-form" onSubmit={submit}>
          <label>
            Name
            <input value={name} onChange={(event) => setName(event.target.value)} required />
          </label>
          <label>
            Code
            <input value={code} onChange={(event) => setCode(event.target.value)} />
          </label>
          <label className="form-wide">
            Address
            <input value={address} onChange={(event) => setAddress(event.target.value)} />
          </label>
          <button className="primary-button form-submit" type="submit" disabled={saving}>
            <Plus size={16} />
            {saving ? "Creating..." : "Create warehouse"}
          </button>
        </form>
      </section>
      <div className="table-card">
        <table>
          <thead>
            <tr>
              <th>Warehouse</th>
              <th>Code</th>
              <th>Address</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((warehouse) => (
              <tr key={warehouse._id}>
                <td>
                  <strong>{warehouse.name}</strong>
                  <span className="muted-block">{date(warehouse.createdAt)}</span>
                </td>
                <td>{warehouse.code || "N/A"}</td>
                <td>{warehouse.address || "Not set"}</td>
                <td>
                  <StatusPill status={activeLabel(warehouse.isActive)} />
                </td>
                <td>
                  <div className="row-actions">
                    <button
                      className="ghost-button small"
                      type="button"
                      onClick={() => void toggle(warehouse)}
                    >
                      {warehouse.isActive === false ? "Activate" : "Disable"}
                    </button>
                    <button
                      className="icon-button danger"
                      type="button"
                      onClick={() => void remove(warehouse._id)}
                      aria-label="Delete warehouse"
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
            title="No warehouses found"
            detail="Create a warehouse to start assigning stock locations."
          />
        )}
        {loading && <p className="table-note">Loading warehouses...</p>}
      </div>
    </DataPage>
  );
}

