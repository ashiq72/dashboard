import { type FormEvent, useCallback, useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { ecommerceApi } from "../../lib/api";
import type { ApiMeta, Slider } from "../../types";
import { useDebouncedValue } from "../../shared/hooks/useDebouncedValue";
import { activeLabel, confirmAction, getErrorMessage } from "../../shared/utils";
import { EmptyState, ErrorBanner, StatusPill } from "../../shared/ui/feedback";
import { DataPage, Pagination, PanelTitle, SearchBox } from "../../shared/ui/page";

export function Sliders() {
  const [rows, setRows] = useState<Slider[]>([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"all" | "active" | "inactive">("all");
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState<ApiMeta>({});
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [image, setImage] = useState("");
  const [link, setLink] = useState("");
  const [buttonText, setButtonText] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const debouncedSearch = useDebouncedValue(search);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await ecommerceApi.sliders({
        search: debouncedSearch,
        status,
        page,
        limit: 20,
      });
      setRows(response.rows);
      setMeta(response.meta);
    } catch (err) {
      setError(getErrorMessage(err, "Sliders failed to load"));
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, page, status]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, status]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      await ecommerceApi.createSlider({
        title,
        subtitle: subtitle || undefined,
        image,
        link: link || undefined,
        buttonText: buttonText || undefined,
        isActive: true,
      });
      setTitle("");
      setSubtitle("");
      setImage("");
      setLink("");
      setButtonText("");
      await load();
    } catch (err) {
      setError(getErrorMessage(err, "Slider could not be created"));
    } finally {
      setSaving(false);
    }
  };

  const toggle = async (slider: Slider) => {
    setError("");
    try {
      await ecommerceApi.updateSlider(slider._id, {
        isActive: slider.isActive === false,
      });
      await load();
    } catch (err) {
      setError(getErrorMessage(err, "Slider status could not be updated"));
    }
  };

  const remove = async (id: string) => {
    if (!confirmAction("Delete this slider?")) return;
    setError("");
    try {
      await ecommerceApi.deleteSlider(id);
      await load();
    } catch (err) {
      setError(getErrorMessage(err, "Slider could not be deleted"));
    }
  };

  return (
    <DataPage
      title="Sliders"
      detail="Storefront promotional image management"
      actions={
        <div className="filters">
          <SearchBox value={search} onChange={setSearch} placeholder="Search sliders" />
          <select
            value={status}
            onChange={(event) =>
              setStatus(event.target.value as "all" | "active" | "inactive")
            }
          >
            <option value="all">All status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      }
    >
      {error && <ErrorBanner message={error} />}
      <section className="panel admin-form-panel">
        <PanelTitle title="Add slider" detail="Create a storefront promotion" />
        <form className="admin-form" onSubmit={submit}>
          <label>
            Title
            <input value={title} onChange={(event) => setTitle(event.target.value)} required />
          </label>
          <label>
            Button
            <input value={buttonText} onChange={(event) => setButtonText(event.target.value)} />
          </label>
          <label className="form-wide">
            Image URL
            <input
              value={image}
              onChange={(event) => setImage(event.target.value)}
              type="url"
              placeholder="https://..."
              required
            />
          </label>
          <label className="form-wide">
            Subtitle
            <input value={subtitle} onChange={(event) => setSubtitle(event.target.value)} />
          </label>
          <label className="form-wide">
            Link
            <input value={link} onChange={(event) => setLink(event.target.value)} />
          </label>
          <button className="primary-button form-submit" type="submit" disabled={saving}>
            <Plus size={16} />
            {saving ? "Creating..." : "Create slider"}
          </button>
        </form>
      </section>
      <div className="slider-grid">
        {rows.map((slider) => (
          <article className="slider-card" key={slider._id}>
            <img src={slider.image} alt="" />
            <div className="slider-card-body">
              <div>
                <h3>{slider.title}</h3>
                <p>{slider.subtitle || slider.link || "No secondary copy"}</p>
              </div>
              <StatusPill status={activeLabel(slider.isActive)} />
              <div className="row-actions">
                <button
                  className="ghost-button small"
                  type="button"
                  onClick={() => void toggle(slider)}
                >
                  {slider.isActive === false ? "Activate" : "Disable"}
                </button>
                <button
                  className="icon-button danger"
                  type="button"
                  onClick={() => void remove(slider._id)}
                  aria-label="Delete slider"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>
      {!loading && rows.length === 0 && (
        <EmptyState
          title="No sliders found"
          detail="Create a promotional slider for the storefront."
        />
      )}
      {loading && <p className="table-note">Loading sliders...</p>}
      <Pagination meta={meta} page={page} loading={loading} onPageChange={setPage} />
    </DataPage>
  );
}

