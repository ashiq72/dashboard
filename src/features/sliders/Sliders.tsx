import { type FormEvent, useCallback, useEffect, useState } from "react";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { ecommerceApi } from "../../lib/api";
import type { ApiMeta, Slider } from "../../types";
import { useDebouncedValue } from "../../shared/hooks/useDebouncedValue";
import { activeLabel, confirmAction, getErrorMessage } from "../../shared/utils";
import { EmptyState, ErrorBanner, StatusPill } from "../../shared/ui/feedback";
import { ImageUploadField } from "../../shared/ui/ImageUploadField";
import { DataPage, Pagination, PanelTitle, SearchBox } from "../../shared/ui/page";

export function Sliders() {
  const [rows, setRows] = useState<Slider[]>([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"all" | "active" | "inactive">("all");
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState<ApiMeta>({});
  const [loading, setLoading] = useState(false);
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
          <Link className="primary-button" to="/sliders/new">
            <Plus size={16} />
            New slider
          </Link>
        </div>
      }
    >
      {error && <ErrorBanner message={error} />}
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

export function SliderCreatePage() {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [image, setImage] = useState("");
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [link, setLink] = useState("");
  const [buttonText, setButtonText] = useState("");
  const [order, setOrder] = useState("0");
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      if (imageFiles.length) {
        const formData = new FormData();
        formData.set("title", title);
        formData.set("subtitle", subtitle);
        formData.set("link", link);
        formData.set("buttonText", buttonText);
        formData.set("order", String(Number(order) || 0));
        formData.set("isActive", String(isActive));
        formData.set("image", imageFiles[0]);
        await ecommerceApi.createSliderForm(formData);
      } else {
        await ecommerceApi.createSlider({
          title,
          subtitle: subtitle || undefined,
          image,
          link: link || undefined,
          buttonText: buttonText || undefined,
          order: Number(order) || 0,
          isActive,
        });
      }
      navigate("/sliders");
    } catch (err) {
      setError(getErrorMessage(err, "Slider could not be created"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <DataPage
      title="Create slider"
      detail="Prepare a storefront promotion with focused campaign content"
      actions={
        <Link className="ghost-button" to="/sliders">
          <ArrowLeft size={16} />
          Slider list
        </Link>
      }
    >
      {error && <ErrorBanner message={error} />}
      <section className="panel admin-form-panel create-form-panel">
        <PanelTitle title="Promotion details" detail="Content, destination, and visibility" />
        <form className="admin-form" onSubmit={submit}>
          <label>
            Title
            <input value={title} onChange={(event) => setTitle(event.target.value)} required />
          </label>
          <label>
            Button label
            <input value={buttonText} onChange={(event) => setButtonText(event.target.value)} />
          </label>
          <label>
            Display order
            <input
              value={order}
              onChange={(event) => setOrder(event.target.value)}
              type="number"
              min="0"
            />
          </label>
          <label className="check-row">
            <input
              checked={isActive}
              onChange={(event) => setIsActive(event.target.checked)}
              type="checkbox"
            />
            Active promotion
          </label>
          <label className="form-wide">
            Image URL
            <input
              value={image}
              onChange={(event) => setImage(event.target.value)}
              type="url"
              placeholder="https://..."
              required={!imageFiles.length}
            />
          </label>
          <div className="form-wide">
            <ImageUploadField
              title="Upload slider image"
              files={imageFiles}
              onFilesChange={setImageFiles}
              existingUrls={image ? [image] : []}
            />
          </div>
          <label className="form-wide">
            Subtitle
            <input value={subtitle} onChange={(event) => setSubtitle(event.target.value)} />
          </label>
          <label className="form-wide">
            Destination link
            <input value={link} onChange={(event) => setLink(event.target.value)} />
          </label>
          <button className="primary-button form-submit" type="submit" disabled={saving}>
            <Plus size={16} />
            {saving ? "Creating..." : "Create slider"}
          </button>
        </form>
      </section>
    </DataPage>
  );
}
