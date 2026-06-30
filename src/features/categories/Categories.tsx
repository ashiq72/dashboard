import {
  type CSSProperties,
  type FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  ArrowLeft,
  ChevronRight,
  Image,
  Layers,
  Plus,
  RefreshCw,
  Tags,
} from "lucide-react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ecommerceApi } from "../../lib/api";
import type { ApiMeta, Category } from "../../types";
import { useDebouncedValue } from "../../shared/hooks/useDebouncedValue";
import { activeLabel, getErrorMessage } from "../../shared/utils";
import { EmptyState, ErrorBanner, StatusPill } from "../../shared/ui/feedback";
import { ImageUploadField } from "../../shared/ui/ImageUploadField";
import {
  DataPage,
  MetricCard,
  Pagination,
  PanelTitle,
  SearchBox,
} from "../../shared/ui/page";

type CategoryOption = {
  id: string;
  label: string;
  depth: number;
  path: string;
};

const parentIdOf = (category: Category) =>
  typeof category.parent === "string" ? category.parent : category.parent?._id || "";

const parentNameOf = (category: Category, options: CategoryOption[]) => {
  const parent = category.parent;
  if (!parent) return "Root category";
  if (typeof parent === "string") {
    return options.find((option) => option.id === parent)?.label || "Parent category";
  }
  return parent.name || parent.slug || "Parent category";
};

const flattenCategoryTree = (
  categories: Category[],
  depth = 0,
  chain: string[] = [],
): CategoryOption[] =>
  categories.flatMap((category) => {
    const nextChain = [...chain, category.name];
    return [
      {
        id: category._id,
        label: category.name,
        depth,
        path: nextChain.join(" > "),
      },
      ...flattenCategoryTree(category.children || [], depth + 1, nextChain),
    ];
  });

const maxCategoryDepth = (categories: Category[], depth = 0): number =>
  categories.reduce(
    (max, category) =>
      Math.max(max, depth, maxCategoryDepth(category.children || [], depth + 1)),
    depth,
  );

export function Categories() {
  const navigate = useNavigate();
  const [rows, setRows] = useState<Category[]>([]);
  const [tree, setTree] = useState<Category[]>([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"all" | "active" | "inactive">("all");
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState<ApiMeta>({});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const debouncedSearch = useDebouncedValue(search);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [response, treeResponse] = await Promise.all([
        ecommerceApi.categories({
          search: debouncedSearch,
          status,
          page,
          limit: 20,
        }),
        ecommerceApi.categoryTree(),
      ]);
      setRows(response.rows);
      setMeta(response.meta);
      setTree(treeResponse);
    } catch (err) {
      setError(getErrorMessage(err, "Categories failed to load"));
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, page, status]);

  const categoryOptions = useMemo(() => flattenCategoryTree(tree), [tree]);
  const rootCount = tree.length;
  const chainDepth = tree.length ? maxCategoryDepth(tree) + 1 : 0;

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, status]);

  return (
    <DataPage
      title="Categories"
      detail="Build root, child, and deep product discovery chains"
      actions={
        <div className="filters">
          <SearchBox
            value={search}
            onChange={setSearch}
            placeholder="Search categories"
          />
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
          <button className="ghost-button" type="button" onClick={() => void load()}>
            <RefreshCw size={16} />
            Refresh
          </button>
          <Link className="primary-button" to="/categories/new">
            <Plus size={16} />
            New category
          </Link>
        </div>
      }
    >
      {error && <ErrorBanner message={error} />}

      <div className="metric-grid compact">
        <MetricCard
          icon={Tags}
          label="Listed"
          value={String(meta.total || rows.length)}
          detail="Categories in current filter"
        />
        <MetricCard
          icon={Layers}
          label="Root chains"
          value={String(rootCount)}
          detail="Top-level merchandising groups"
        />
        <MetricCard
          icon={ChevronRight}
          label="Deepest chain"
          value={String(chainDepth)}
          detail="Maximum category levels"
        />
        <MetricCard
          icon={Image}
          label="Media ready"
          value={String(rows.filter((category) => category.image).length)}
          detail="Categories with image URLs"
        />
      </div>

      <CategoryTreePanel
        tree={tree}
        loading={loading}
        onAddChild={(parentId) =>
          navigate(`/categories/new?parent=${parentId}`)
        }
      />

      <div className="category-grid">
        {rows.map((category) => (
          <article className="category-card" key={category._id}>
            <div className="category-card-head">
              <div className="category-image">
                {category.image ? <img src={category.image} alt="" /> : <Tags />}
              </div>
              <StatusPill status={category.status || activeLabel(category.isActive)} />
            </div>
            <div>
              <h3>{category.name}</h3>
              <p>{category.slug || "No slug"}</p>
              <span className="category-chain-text">
                {categoryOptions.find((option) => option.id === category._id)?.path ||
                  parentNameOf(category, categoryOptions)}
              </span>
            </div>
            <div className="category-card-meta">
              <span>Level {Number(category.level || 0) + 1}</span>
              <span>{parentIdOf(category) ? "Child category" : "Root category"}</span>
            </div>
          </article>
        ))}
      </div>
      {!loading && rows.length === 0 && (
        <EmptyState
          title="No categories found"
          detail="Categories from Base360 will appear here."
        />
      )}
      {loading && <p className="table-note">Loading categories...</p>}
      <Pagination meta={meta} page={page} loading={loading} onPageChange={setPage} />
    </DataPage>
  );
}

export function CategoryCreatePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [tree, setTree] = useState<Category[]>([]);
  const [selectedParent, setSelectedParent] = useState(
    searchParams.get("parent") || "",
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadTree = async () => {
      setLoading(true);
      try {
        setTree(await ecommerceApi.categoryTree());
      } catch (err) {
        setError(getErrorMessage(err, "Category chain could not be loaded"));
      } finally {
        setLoading(false);
      }
    };
    void loadTree();
  }, []);

  const options = useMemo(() => flattenCategoryTree(tree), [tree]);

  return (
    <DataPage
      title="Create category"
      detail="Add a root category or place it anywhere in the catalog hierarchy"
      actions={
        <Link className="ghost-button" to="/categories">
          <ArrowLeft size={16} />
          Category list
        </Link>
      }
    >
      {error && <ErrorBanner message={error} />}
      <div className="category-create-layout">
        <CategoryCreateForm
          options={options}
          selectedParent={selectedParent}
          onParentChange={setSelectedParent}
          onCreated={async () => navigate("/categories")}
        />
        <CategoryTreePanel
          tree={tree}
          loading={loading}
          onAddChild={setSelectedParent}
        />
      </div>
    </DataPage>
  );
}

function CategoryCreateForm({
  options,
  selectedParent,
  onParentChange,
  onCreated,
}: {
  options: CategoryOption[];
  selectedParent: string;
  onParentChange: (parentId: string) => void;
  onCreated: () => Promise<void>;
}) {
  const [name, setName] = useState("");
  const [image, setImage] = useState("");
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const selected = options.find((option) => option.id === selectedParent);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      if (imageFiles.length) {
        const formData = new FormData();
        formData.set("name", name);
        formData.set("parent", selectedParent || "null");
        formData.set("image", imageFiles[0]);
        await ecommerceApi.createCategoryForm(formData);
      } else {
        await ecommerceApi.createCategory({
          name,
          image: image || undefined,
          parent: selectedParent || null,
        });
      }
      setName("");
      setImage("");
      setImageFiles([]);
      await onCreated();
    } catch (err) {
      setError(getErrorMessage(err, "Category could not be created"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="panel admin-form-panel">
      <PanelTitle
        title="Add category"
        detail={selected ? `Adding inside ${selected.path}` : "Create a root category or nested child"}
      />
      {error && <ErrorBanner message={error} />}
      <form className="admin-form compact-form" onSubmit={submit}>
        <label>
          Name
          <input value={name} onChange={(event) => setName(event.target.value)} required />
        </label>
        <label>
          Parent chain
          <select
            value={selectedParent}
            onChange={(event) => onParentChange(event.target.value)}
          >
            <option value="">Root category</option>
            {options.map((option) => (
              <option key={option.id} value={option.id}>
                {"- ".repeat(option.depth)}
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label className="form-wide">
          Image URL
          <input
            value={image}
            onChange={(event) => setImage(event.target.value)}
            placeholder="https://..."
            type="url"
          />
        </label>
        <div className="form-wide">
          <ImageUploadField
            title="Upload category image"
            files={imageFiles}
            onFilesChange={setImageFiles}
            existingUrls={image ? [image] : []}
            compact
          />
        </div>
        <button className="primary-button form-submit" type="submit" disabled={saving}>
          <Plus size={16} />
          {saving ? "Creating..." : "Create category"}
        </button>
        {selectedParent && (
          <button
            className="ghost-button form-submit"
            type="button"
            onClick={() => onParentChange("")}
          >
            Clear parent
          </button>
        )}
      </form>
    </section>
  );
}

function CategoryTreePanel({
  tree,
  loading,
  onAddChild,
}: {
  tree: Category[];
  loading: boolean;
  onAddChild: (parentId: string) => void;
}) {
  return (
    <section className="panel category-tree-panel">
      <PanelTitle title="Category chain" detail="Active nested category structure" />
      {loading && <p className="table-note">Loading category chain...</p>}
      {!loading && tree.length === 0 && (
        <EmptyState
          title="No category chain"
          detail="Create a root category, then add child categories under it."
        />
      )}
      <div className="category-tree">
        {tree.map((category) => (
          <CategoryTreeNode
            key={category._id}
            category={category}
            depth={0}
            chain={[]}
            onAddChild={onAddChild}
          />
        ))}
      </div>
    </section>
  );
}

function CategoryTreeNode({
  category,
  depth,
  chain,
  onAddChild,
}: {
  category: Category;
  depth: number;
  chain: string[];
  onAddChild: (parentId: string) => void;
}) {
  const nextChain = [...chain, category.name];
  const children = category.children || [];

  return (
    <div
      className="category-tree-node"
      style={{ "--depth": depth } as CSSProperties}
    >
      <div className="category-node-line">
        <span className="category-node-icon">
          <Tags size={15} />
        </span>
        <div className="category-node-main">
          <strong>{category.name}</strong>
          <span>{nextChain.join(" > ")}</span>
        </div>
        <StatusPill status={category.status || activeLabel(category.isActive)} />
        <button
          className="ghost-button small"
          type="button"
          onClick={() => onAddChild(category._id)}
        >
          <Plus size={14} />
          Child
        </button>
      </div>
      {children.length > 0 && (
        <div className="category-node-children">
          {children.map((child) => (
            <CategoryTreeNode
              key={child._id}
              category={child}
              depth={depth + 1}
              chain={nextChain}
              onAddChild={onAddChild}
            />
          ))}
        </div>
      )}
    </div>
  );
}
