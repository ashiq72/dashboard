import { type FormEvent, useCallback, useEffect, useState } from "react";
import {
  Boxes,
  CircleDollarSign,
  PackageCheck,
  Plus,
  RefreshCw,
  Save,
  Search,
  ShoppingBag,
  Tags,
  TriangleAlert,
  Trash2,
  Truck,
  X,
} from "lucide-react";
import { ecommerceApi } from "../../lib/api";
import type {
  ApiMeta,
  Product,
  ProductFaq,
  ProductListStatus,
  ProductOption,
  ProductPayload,
  ProductStatus,
  ProductVariant,
} from "../../types";
import { useDebouncedValue } from "../../shared/hooks/useDebouncedValue";
import {
  activeLabel,
  attributesFromText,
  confirmAction,
  date,
  getErrorMessage,
  joinText,
  money,
  numberOrUndefined,
  parseTagText,
  productImage,
  productStatus,
  stockOf,
  textFromAttributes,
} from "../../shared/utils";
import { EmptyState, ErrorBanner, StatusPill } from "../../shared/ui/feedback";
import { DataPage, MetricCard, Pagination, PanelTitle, SearchBox } from "../../shared/ui/page";

function ProductThumb({ product }: { product: Product }) {
  const [src, setSrc] = useState(productImage(product));

  useEffect(() => {
    setSrc(productImage(product));
  }, [product]);

  return (
    <img
      src={src}
      alt=""
      onError={() => setSrc("/vite.svg")}
    />
  );
}

export function Products() {
  const [rows, setRows] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<ProductListStatus>("all");
  const [stockFilter, setStockFilter] = useState<"all" | "in" | "out">("all");
  const [includeGlobal, setIncludeGlobal] = useState(false);
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [pendingId, setPendingId] = useState("");
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState<ApiMeta>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const debouncedSearch = useDebouncedValue(search);
  const debouncedMinPrice = useDebouncedValue(minPrice);
  const debouncedMaxPrice = useDebouncedValue(maxPrice);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      if (
        debouncedMinPrice &&
        debouncedMaxPrice &&
        Number(debouncedMinPrice) > Number(debouncedMaxPrice)
      ) {
        throw new Error("Minimum price cannot be greater than maximum price");
      }
      const response = await ecommerceApi.products({
        search: debouncedSearch,
        status,
        includeGlobal: includeGlobal || undefined,
        inStock:
          stockFilter === "in" ? true : stockFilter === "out" ? false : undefined,
        minPrice: debouncedMinPrice || undefined,
        maxPrice: debouncedMaxPrice || undefined,
        page,
        limit: 20,
      });
      setRows(response.rows);
      setMeta(response.meta);
    } catch (err) {
      setError(getErrorMessage(err, "Products failed to load"));
    } finally {
      setLoading(false);
    }
  }, [
    debouncedMaxPrice,
    debouncedMinPrice,
    debouncedSearch,
    includeGlobal,
    page,
    status,
    stockFilter,
  ]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    setPage(1);
  }, [
    debouncedMaxPrice,
    debouncedMinPrice,
    debouncedSearch,
    includeGlobal,
    status,
    stockFilter,
  ]);

  const updateStatus = async (id: string, next: ProductStatus) => {
    setError("");
    setPendingId(id);
    try {
      await ecommerceApi.updateProductStatus(id, next);
      setRows((current) =>
        current.map((product) =>
          product._id === id
            ? { ...product, status: next, isActive: next === "active" }
            : product,
        ),
      );
      if (selectedProduct?._id === id) {
        setSelectedProduct({
          ...selectedProduct,
          status: next,
          isActive: next === "active",
        });
      }
      await load();
    } catch (err) {
      setError(getErrorMessage(err, "Product status could not be updated"));
    } finally {
      setPendingId("");
    }
  };

  const archiveProduct = async (product: Product) => {
    if (!confirmAction(`Archive ${product.name}?`)) return;
    setError("");
    setPendingId(product._id);
    try {
      await ecommerceApi.deleteProduct(product._id);
      if (selectedProduct?._id === product._id) setSelectedProduct(null);
      await load();
    } catch (err) {
      setError(getErrorMessage(err, "Product could not be archived"));
    } finally {
      setPendingId("");
    }
  };

  const productStats = {
    total: Number(meta.total || rows.length),
    active: rows.filter((product) => productStatus(product) === "active").length,
    lowStock: rows.filter(
      (product) =>
        product.trackStock !== false &&
        Number(product.lowStockThreshold || 0) >= stockOf(product),
    ).length,
    outOfStock: rows.filter(
      (product) => product.trackStock !== false && stockOf(product) <= 0,
    ).length,
  };

  return (
    <DataPage
      title="Products"
      detail="Catalog management with Base360 product APIs"
      actions={
        <div className="filters">
          <SearchBox value={search} onChange={setSearch} placeholder="Search products" />
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value as ProductListStatus)}
          >
            <option value="all">All status</option>
            <option value="draft">Draft</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="archived">Archived</option>
          </select>
          <select
            value={stockFilter}
            onChange={(event) =>
              setStockFilter(event.target.value as "all" | "in" | "out")
            }
          >
            <option value="all">All stock</option>
            <option value="in">In stock</option>
            <option value="out">Out of stock</option>
          </select>
        </div>
      }
    >
      {error && <ErrorBanner message={error} />}
      <section className="metric-grid compact">
        <MetricCard
          icon={ShoppingBag}
          label="Matched products"
          value={String(productStats.total)}
          detail={`${rows.length} loaded`}
        />
        <MetricCard
          icon={PackageCheck}
          label="Active"
          value={String(productStats.active)}
          detail="On this page"
        />
        <MetricCard
          icon={TriangleAlert}
          label="Low stock"
          value={String(productStats.lowStock)}
          detail="At threshold"
        />
        <MetricCard
          icon={Boxes}
          label="Out of stock"
          value={String(productStats.outOfStock)}
          detail="Needs restock"
        />
      </section>
      <section className="panel product-filter-panel">
        <PanelTitle title="Catalog filters" detail="Price, stock, and product scope" />
        <div className="product-filter-grid">
          <label>
            Min price
            <input
              value={minPrice}
              onChange={(event) => setMinPrice(event.target.value)}
              type="number"
              min="0"
              step="0.01"
            />
          </label>
          <label>
            Max price
            <input
              value={maxPrice}
              onChange={(event) => setMaxPrice(event.target.value)}
              type="number"
              min="0"
              step="0.01"
            />
          </label>
          <label className="check-row">
            <input
              checked={includeGlobal}
              onChange={(event) => setIncludeGlobal(event.target.checked)}
              type="checkbox"
            />
            Include global products
          </label>
          <button className="ghost-button" type="button" onClick={() => void load()}>
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>
      </section>
      <ProductCreateForm onCreated={load} />
      {selectedProduct && (
        <ProductEditPanel
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onSaved={async (product) => {
            setSelectedProduct(product);
            await load();
          }}
          onArchived={() => archiveProduct(selectedProduct)}
        />
      )}
      <div className="table-card">
        <table>
          <thead>
            <tr>
              <th>Product</th>
              <th>SKU</th>
              <th>Price</th>
              <th>Stock</th>
              <th>Scope</th>
              <th>Status</th>
              <th>Updated</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((product) => (
              <tr
                className={selectedProduct?._id === product._id ? "selected-row" : ""}
                key={product._id}
              >
                <td>
                  <div className="product-cell">
                    <ProductThumb product={product} />
                    <div>
                      <strong>{product.name}</strong>
                      <span>{product.brand || product.slug || "No brand"}</span>
                    </div>
                  </div>
                </td>
                <td>{product.sku || "N/A"}</td>
                <td>{money(product.salePrice || product.price, product.currency || "USD")}</td>
                <td>
                  <div className="stock-cell">
                    <strong>{product.trackStock === false ? "Not tracked" : stockOf(product)}</strong>
                    {product.trackStock !== false && (
                      <span>Low at {product.lowStockThreshold ?? 0}</span>
                    )}
                  </div>
                </td>
                <td>
                  <StatusPill status={product.scope || "tenant"} />
                </td>
                <td>
                  <select
                    className="inline-select"
                    value={productStatus(product)}
                    disabled={pendingId === product._id}
                    onChange={(event) =>
                      void updateStatus(
                        product._id,
                        event.target.value as ProductStatus,
                      )
                    }
                  >
                    <option value="draft">Draft</option>
                    <option value="active">Active</option>
                    <option value="archived">Archived</option>
                  </select>
                </td>
                <td>{date(product.updatedAt)}</td>
                <td>
                  <div className="row-actions">
                    <button
                      className="ghost-button small"
                      type="button"
                      onClick={() => setSelectedProduct(product)}
                    >
                      Edit
                    </button>
                    <button
                      className="icon-button danger"
                      type="button"
                      disabled={pendingId === product._id}
                      onClick={() => void archiveProduct(product)}
                      aria-label="Archive product"
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
            title="No products found"
            detail="Create products from the backend or adjust the filters."
          />
        )}
        {loading && <p className="table-note">Loading products...</p>}
      </div>
      <Pagination meta={meta} page={page} loading={loading} onPageChange={setPage} />
    </DataPage>
  );
}

const productEditorTabs = [
  "Overview",
  "Filter",
  "Features",
  "Price",
  "Stock",
  "Description",
  "Image",
  "File",
  "Variant",
  "FAQ",
  "Meta",
] as const;

type ProductEditorTab = (typeof productEditorTabs)[number];

function ProductEditPanel({
  product,
  onClose,
  onSaved,
  onArchived,
}: {
  product: Product;
  onClose: () => void;
  onSaved: (product: Product) => Promise<void>;
  onArchived: () => void;
}) {
  const [activeTab, setActiveTab] = useState<ProductEditorTab>("Overview");
  const [name, setName] = useState(product.name || "");
  const [slug, setSlug] = useState(product.slug || "");
  const [sku, setSku] = useState(product.sku || "");
  const [barcode, setBarcode] = useState(product.barcode || "");
  const [brand, setBrand] = useState(product.brand || "");
  const [tags, setTags] = useState(joinText(product.tags));
  const [features, setFeatures] = useState(joinText(product.features));
  const [status, setStatus] = useState<ProductStatus>(productStatus(product));
  const [isFeatured, setIsFeatured] = useState(Boolean(product.isFeatured));
  const [price, setPrice] = useState(String(product.price ?? ""));
  const [salePrice, setSalePrice] = useState(String(product.salePrice ?? ""));
  const [costPrice, setCostPrice] = useState(String(product.costPrice ?? ""));
  const [currency, setCurrency] = useState(product.currency || "USD");
  const [trackStock, setTrackStock] = useState(product.trackStock !== false);
  const [stock, setStock] = useState(String(product.stock ?? ""));
  const [lowStockThreshold, setLowStockThreshold] = useState(
    String(product.lowStockThreshold ?? ""),
  );
  const [inventoryDelta, setInventoryDelta] = useState("");
  const [weight, setWeight] = useState(String(product.weight ?? ""));
  const [length, setLength] = useState(String(product.dimensions?.length ?? ""));
  const [width, setWidth] = useState(String(product.dimensions?.width ?? ""));
  const [height, setHeight] = useState(String(product.dimensions?.height ?? ""));
  const [dimensionUnit, setDimensionUnit] = useState(product.dimensions?.unit || "cm");
  const [shortDescription, setShortDescription] = useState(
    product.shortDescription || "",
  );
  const [description, setDescription] = useState(product.description || "");
  const [thumbnail, setThumbnail] = useState(product.thumbnail || "");
  const [images, setImages] = useState((product.images || []).join("\n"));
  const [files, setFiles] = useState<FileList | null>(null);
  const [options, setOptions] = useState<ProductOption[]>(
    product.options?.length ? product.options : [{ name: "", values: [] }],
  );
  const [variants, setVariants] = useState<ProductVariant[]>(
    product.variants?.length
      ? product.variants
      : [{ sku: "", price: product.price, stock: 0, isActive: true }],
  );
  const [faqs, setFaqs] = useState<ProductFaq[]>(
    product.faqs?.length ? product.faqs : [{ question: "", answer: "" }],
  );
  const [attributes, setAttributes] = useState(textFromAttributes(product.attributes));
  const [seoTitle, setSeoTitle] = useState(product.seo?.title || "");
  const [seoDescription, setSeoDescription] = useState(product.seo?.description || "");
  const [seoKeywords, setSeoKeywords] = useState(joinText(product.seo?.keywords));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setName(product.name || "");
    setSlug(product.slug || "");
    setSku(product.sku || "");
    setBarcode(product.barcode || "");
    setBrand(product.brand || "");
    setTags(joinText(product.tags));
    setFeatures(joinText(product.features));
    setStatus(productStatus(product));
    setIsFeatured(Boolean(product.isFeatured));
    setPrice(String(product.price ?? ""));
    setSalePrice(String(product.salePrice ?? ""));
    setCostPrice(String(product.costPrice ?? ""));
    setCurrency(product.currency || "USD");
    setTrackStock(product.trackStock !== false);
    setStock(String(product.stock ?? ""));
    setLowStockThreshold(String(product.lowStockThreshold ?? ""));
    setWeight(String(product.weight ?? ""));
    setLength(String(product.dimensions?.length ?? ""));
    setWidth(String(product.dimensions?.width ?? ""));
    setHeight(String(product.dimensions?.height ?? ""));
    setDimensionUnit(product.dimensions?.unit || "cm");
    setShortDescription(product.shortDescription || "");
    setDescription(product.description || "");
    setThumbnail(product.thumbnail || "");
    setImages((product.images || []).join("\n"));
    setFiles(null);
    setOptions(product.options?.length ? product.options : [{ name: "", values: [] }]);
    setVariants(
      product.variants?.length
        ? product.variants
        : [{ sku: "", price: product.price, stock: 0, isActive: true }],
    );
    setFaqs(product.faqs?.length ? product.faqs : [{ question: "", answer: "" }]);
    setAttributes(textFromAttributes(product.attributes));
    setSeoTitle(product.seo?.title || "");
    setSeoDescription(product.seo?.description || "");
    setSeoKeywords(joinText(product.seo?.keywords));
    setError("");
    setActiveTab("Overview");
  }, [product]);

  const buildPayload = (): ProductPayload => {
    const parsedPrice = numberOrUndefined(price);
    if (parsedPrice === undefined) throw new Error("Price is required");
    const parsedSalePrice = numberOrUndefined(salePrice);
    if (parsedSalePrice !== undefined && parsedSalePrice > parsedPrice) {
      throw new Error("Sale price must be less than or equal to price");
    }

    return {
      name,
      slug: slug || undefined,
      sku: sku || undefined,
      barcode: barcode || undefined,
      brand: brand || undefined,
      tags: parseTagText(tags),
      features: parseTagText(features),
      status,
      isFeatured,
      price: parsedPrice,
      salePrice: parsedSalePrice,
      costPrice: numberOrUndefined(costPrice),
      currency: currency || undefined,
      trackStock,
      stock: numberOrUndefined(stock),
      lowStockThreshold: numberOrUndefined(lowStockThreshold),
      weight: numberOrUndefined(weight),
      dimensions: {
        length: numberOrUndefined(length),
        width: numberOrUndefined(width),
        height: numberOrUndefined(height),
        unit: dimensionUnit || undefined,
      },
      shortDescription: shortDescription || undefined,
      description: description || undefined,
      thumbnail: thumbnail || undefined,
      images: images
        .split("\n")
        .map((imageUrl) => imageUrl.trim())
        .filter(Boolean),
      options: options
        .map((option) => ({
          name: option.name?.trim() || "",
          values: Array.isArray(option.values)
            ? option.values
            : String(option.values || "")
                .split(",")
                .map((value) => value.trim())
                .filter(Boolean),
        }))
        .filter((option) => option.name && option.values.length),
      variants: variants
        .map((variant) => ({
          sku: variant.sku || undefined,
          barcode: variant.barcode || undefined,
          price: variant.price,
          salePrice: variant.salePrice,
          stock: variant.stock,
          lowStockThreshold: variant.lowStockThreshold,
          image: variant.image || undefined,
          isActive: variant.isActive !== false,
          attributes: variant.attributes,
        }))
        .filter((variant) => variant.sku || variant.price !== undefined),
      attributes: attributesFromText(attributes),
      faqs: faqs
        .map((faq) => ({
          question: faq.question.trim(),
          answer: faq.answer.trim(),
        }))
        .filter((faq) => faq.question && faq.answer),
      seo: {
        title: seoTitle || undefined,
        description: seoDescription || undefined,
        keywords: parseTagText(seoKeywords),
      },
    };
  };

  const save = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const payload = buildPayload();
      let response;
      if (files?.length) {
        const formData = new FormData();
        Object.entries(payload).forEach(([key, value]) => {
          if (value === undefined) return;
          if (typeof value === "object") {
            formData.set(key, JSON.stringify(value));
          } else {
            formData.set(key, String(value));
          }
        });
        Array.from(files).forEach((file) => formData.append("images", file));
        response = await ecommerceApi.updateProductForm(product._id, formData);
      } else {
        response = await ecommerceApi.updateProduct(product._id, payload);
      }

      if (inventoryDelta.trim()) {
        await ecommerceApi.adjustProductInventory(product._id, {
          delta: Number(inventoryDelta),
          reason: "manual",
          note: "Dashboard adjustment",
        });
        setInventoryDelta("");
      }

      await onSaved(response.data);
    } catch (err) {
      setError(getErrorMessage(err, "Product could not be saved"));
    } finally {
      setSaving(false);
    }
  };

  const setOption = (index: number, patch: Partial<ProductOption>) => {
    setOptions((current) =>
      current.map((option, optionIndex) =>
        optionIndex === index ? { ...option, ...patch } : option,
      ),
    );
  };

  const setVariant = (index: number, patch: Partial<ProductVariant>) => {
    setVariants((current) =>
      current.map((variant, variantIndex) =>
        variantIndex === index ? { ...variant, ...patch } : variant,
      ),
    );
  };

  const setFaq = (index: number, patch: Partial<ProductFaq>) => {
    setFaqs((current) =>
      current.map((faq, faqIndex) =>
        faqIndex === index ? { ...faq, ...patch } : faq,
      ),
    );
  };

  return (
    <section className="product-editor panel">
      <form onSubmit={save}>
        <div className="product-editor-head">
          <div className="product-cell">
            <ProductThumb product={{ ...product, thumbnail }} />
            <div>
              <h3>{name || product.name}</h3>
              <span>{sku || "No SKU"} · {product.scope || "tenant"}</span>
            </div>
          </div>
          <div className="row-actions">
            <button className="ghost-button" type="button" onClick={onClose}>
              <X size={16} />
              Close
            </button>
            <button className="icon-button danger" type="button" onClick={onArchived}>
              <Trash2 size={16} />
            </button>
            <button className="primary-button" type="submit" disabled={saving}>
              <Save size={16} />
              {saving ? "Saving..." : "Save product"}
            </button>
          </div>
        </div>

        {error && <ErrorBanner message={error} />}

        <div className="product-tabs">
          {productEditorTabs.map((tab) => (
            <button
              className={activeTab === tab ? "active" : ""}
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ))}
        </div>

        {activeTab === "Overview" && (
          <div className="editor-grid">
            <label>
              Name
              <input value={name} onChange={(event) => setName(event.target.value)} required />
            </label>
            <label>
              Slug
              <input value={slug} onChange={(event) => setSlug(event.target.value)} />
            </label>
            <label>
              SKU
              <input value={sku} onChange={(event) => setSku(event.target.value)} />
            </label>
            <label>
              Barcode
              <input value={barcode} onChange={(event) => setBarcode(event.target.value)} />
            </label>
            <label>
              Brand
              <input value={brand} onChange={(event) => setBrand(event.target.value)} />
            </label>
            <label>
              Status
              <select value={status} onChange={(event) => setStatus(event.target.value as ProductStatus)}>
                <option value="draft">Draft</option>
                <option value="active">Active</option>
                <option value="archived">Archived</option>
              </select>
            </label>
            <label className="check-row">
              <input checked={isFeatured} onChange={(event) => setIsFeatured(event.target.checked)} type="checkbox" />
              Featured product
            </label>
          </div>
        )}

        {activeTab === "Filter" && (
          <div className="editor-grid">
            <label className="form-wide">
              Tags
              <input value={tags} onChange={(event) => setTags(event.target.value)} />
            </label>
            <label className="form-wide">
              Attributes
              <textarea value={attributes} onChange={(event) => setAttributes(event.target.value)} />
            </label>
          </div>
        )}

        {activeTab === "Features" && (
          <div className="editor-grid">
            <label className="form-wide">
              Features
              <textarea value={features} onChange={(event) => setFeatures(event.target.value)} />
            </label>
            {options.map((option, index) => (
              <div className="repeat-row" key={`option-${index}`}>
                <input value={option.name} onChange={(event) => setOption(index, { name: event.target.value })} placeholder="Option" />
                <input value={joinText(option.values)} onChange={(event) => setOption(index, { values: parseTagText(event.target.value) })} placeholder="Values" />
              </div>
            ))}
            <button className="ghost-button" type="button" onClick={() => setOptions((current) => [...current, { name: "", values: [] }])}>
              <Plus size={16} />
              Add option
            </button>
          </div>
        )}

        {activeTab === "Price" && (
          <div className="editor-grid">
            <label>
              Price
              <input value={price} onChange={(event) => setPrice(event.target.value)} type="number" min="0" step="0.01" required />
            </label>
            <label>
              Sale price
              <input value={salePrice} onChange={(event) => setSalePrice(event.target.value)} type="number" min="0" step="0.01" />
            </label>
            <label>
              Cost price
              <input value={costPrice} onChange={(event) => setCostPrice(event.target.value)} type="number" min="0" step="0.01" />
            </label>
            <label>
              Currency
              <input value={currency} onChange={(event) => setCurrency(event.target.value.toUpperCase())} maxLength={3} />
            </label>
          </div>
        )}

        {activeTab === "Stock" && (
          <div className="editor-grid">
            <label className="check-row">
              <input checked={trackStock} onChange={(event) => setTrackStock(event.target.checked)} type="checkbox" />
              Track stock
            </label>
            <label>
              Stock
              <input value={stock} onChange={(event) => setStock(event.target.value)} type="number" min="0" />
            </label>
            <label>
              Low stock
              <input value={lowStockThreshold} onChange={(event) => setLowStockThreshold(event.target.value)} type="number" min="0" />
            </label>
            <label>
              Adjust stock
              <input value={inventoryDelta} onChange={(event) => setInventoryDelta(event.target.value)} type="number" />
            </label>
            <label>
              Weight
              <input value={weight} onChange={(event) => setWeight(event.target.value)} type="number" min="0" step="0.01" />
            </label>
            <label>
              Length
              <input value={length} onChange={(event) => setLength(event.target.value)} type="number" min="0" />
            </label>
            <label>
              Width
              <input value={width} onChange={(event) => setWidth(event.target.value)} type="number" min="0" />
            </label>
            <label>
              Height
              <input value={height} onChange={(event) => setHeight(event.target.value)} type="number" min="0" />
            </label>
            <label>
              Unit
              <input value={dimensionUnit} onChange={(event) => setDimensionUnit(event.target.value)} />
            </label>
          </div>
        )}

        {activeTab === "Description" && (
          <div className="editor-grid">
            <label className="form-wide">
              Short description
              <textarea value={shortDescription} onChange={(event) => setShortDescription(event.target.value)} />
            </label>
            <label className="form-wide">
              Description
              <textarea value={description} onChange={(event) => setDescription(event.target.value)} />
            </label>
          </div>
        )}

        {activeTab === "Image" && (
          <div className="editor-grid">
            <label className="form-wide">
              Thumbnail URL
              <input value={thumbnail} onChange={(event) => setThumbnail(event.target.value)} type="url" />
            </label>
            <label className="form-wide">
              Image URLs
              <textarea value={images} onChange={(event) => setImages(event.target.value)} />
            </label>
            <div className="image-preview-grid">
              {[thumbnail, ...images.split("\n")].filter(Boolean).slice(0, 6).map((imageUrl, index) => (
                <img alt="" key={`${imageUrl}-${index}`} src={imageUrl} />
              ))}
            </div>
          </div>
        )}

        {activeTab === "File" && (
          <div className="editor-grid">
            <label className="form-wide">
              Upload images
              <input multiple onChange={(event) => setFiles(event.target.files)} type="file" accept="image/*" />
            </label>
            <div className="file-list">
              {files ? Array.from(files).map((file) => <span key={file.name}>{file.name}</span>) : <span>No files selected</span>}
            </div>
          </div>
        )}

        {activeTab === "Variant" && (
          <div className="variant-list">
            {variants.map((variant, index) => (
              <div className="variant-row" key={`variant-${index}`}>
                <input value={variant.sku || ""} onChange={(event) => setVariant(index, { sku: event.target.value })} placeholder="SKU" />
                <input value={variant.barcode || ""} onChange={(event) => setVariant(index, { barcode: event.target.value })} placeholder="Barcode" />
                <input value={variant.price ?? ""} onChange={(event) => setVariant(index, { price: numberOrUndefined(event.target.value) })} type="number" placeholder="Price" />
                <input value={variant.salePrice ?? ""} onChange={(event) => setVariant(index, { salePrice: numberOrUndefined(event.target.value) })} type="number" placeholder="Sale" />
                <input value={variant.stock ?? ""} onChange={(event) => setVariant(index, { stock: numberOrUndefined(event.target.value) })} type="number" placeholder="Stock" />
                <label className="check-row">
                  <input checked={variant.isActive !== false} onChange={(event) => setVariant(index, { isActive: event.target.checked })} type="checkbox" />
                  Active
                </label>
              </div>
            ))}
            <button className="ghost-button" type="button" onClick={() => setVariants((current) => [...current, { sku: "", isActive: true }])}>
              <Plus size={16} />
              Add variant
            </button>
          </div>
        )}

        {activeTab === "FAQ" && (
          <div className="faq-list">
            {faqs.map((faq, index) => (
              <div className="faq-row" key={`faq-${index}`}>
                <input value={faq.question} onChange={(event) => setFaq(index, { question: event.target.value })} placeholder="Question" />
                <textarea value={faq.answer} onChange={(event) => setFaq(index, { answer: event.target.value })} placeholder="Answer" />
              </div>
            ))}
            <button className="ghost-button" type="button" onClick={() => setFaqs((current) => [...current, { question: "", answer: "" }])}>
              <Plus size={16} />
              Add FAQ
            </button>
          </div>
        )}

        {activeTab === "Meta" && (
          <div className="editor-grid">
            <label className="form-wide">
              SEO title
              <input value={seoTitle} onChange={(event) => setSeoTitle(event.target.value)} />
            </label>
            <label className="form-wide">
              SEO description
              <textarea value={seoDescription} onChange={(event) => setSeoDescription(event.target.value)} />
            </label>
            <label className="form-wide">
              SEO keywords
              <input value={seoKeywords} onChange={(event) => setSeoKeywords(event.target.value)} />
            </label>
          </div>
        )}
      </form>
    </section>
  );
}

function ProductCreateForm({ onCreated }: { onCreated: () => Promise<void> }) {
  const [name, setName] = useState("");
  const [sku, setSku] = useState("");
  const [brand, setBrand] = useState("");
  const [price, setPrice] = useState("");
  const [salePrice, setSalePrice] = useState("");
  const [stock, setStock] = useState("");
  const [threshold, setThreshold] = useState("");
  const [thumbnail, setThumbnail] = useState("");
  const [status, setStatus] = useState<ProductStatus>("draft");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const parsedPrice = Number(price);
      const parsedSalePrice = salePrice ? Number(salePrice) : undefined;
      const parsedStock = stock ? Number(stock) : undefined;
      const parsedThreshold = threshold ? Number(threshold) : undefined;
      if (!Number.isFinite(parsedPrice)) {
        throw new Error("Product price must be a valid number");
      }
      if (
        parsedSalePrice !== undefined &&
        (!Number.isFinite(parsedSalePrice) || parsedSalePrice > parsedPrice)
      ) {
        throw new Error("Sale price must be valid and less than or equal to price");
      }
      if (
        (parsedStock !== undefined && !Number.isFinite(parsedStock)) ||
        (parsedThreshold !== undefined && !Number.isFinite(parsedThreshold))
      ) {
        throw new Error("Stock values must be valid numbers");
      }
      await ecommerceApi.createProduct({
        name,
        sku: sku || undefined,
        brand: brand || undefined,
        price: parsedPrice,
        salePrice: parsedSalePrice,
        stock: parsedStock,
        lowStockThreshold: parsedThreshold,
        thumbnail: thumbnail || undefined,
        status,
        trackStock: true,
      });
      setName("");
      setSku("");
      setBrand("");
      setPrice("");
      setSalePrice("");
      setStock("");
      setThreshold("");
      setThumbnail("");
      setStatus("draft");
      await onCreated();
    } catch (err) {
      setError(getErrorMessage(err, "Product could not be created"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="panel admin-form-panel">
      <PanelTitle title="Add product" detail="Create a tenant catalog item" />
      {error && <ErrorBanner message={error} />}
      <form className="admin-form" onSubmit={submit}>
        <label>
          Name
          <input value={name} onChange={(event) => setName(event.target.value)} required />
        </label>
        <label>
          SKU
          <input value={sku} onChange={(event) => setSku(event.target.value)} />
        </label>
        <label>
          Brand
          <input value={brand} onChange={(event) => setBrand(event.target.value)} />
        </label>
        <label>
          Price
          <input
            value={price}
            onChange={(event) => setPrice(event.target.value)}
            type="number"
            min="0"
            step="0.01"
            required
          />
        </label>
        <label>
          Sale price
          <input
            value={salePrice}
            onChange={(event) => setSalePrice(event.target.value)}
            type="number"
            min="0"
            step="0.01"
          />
        </label>
        <label>
          Stock
          <input
            value={stock}
            onChange={(event) => setStock(event.target.value)}
            type="number"
            min="0"
          />
        </label>
        <label>
          Low stock
          <input
            value={threshold}
            onChange={(event) => setThreshold(event.target.value)}
            type="number"
            min="0"
          />
        </label>
        <label>
          Status
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value as ProductStatus)}
          >
            <option value="draft">Draft</option>
            <option value="active">Active</option>
            <option value="archived">Archived</option>
          </select>
        </label>
        <label className="form-wide">
          Thumbnail URL
          <input
            value={thumbnail}
            onChange={(event) => setThumbnail(event.target.value)}
            type="url"
            placeholder="https://..."
          />
        </label>
        <button className="primary-button form-submit" type="submit" disabled={saving}>
          <Plus size={16} />
          {saving ? "Creating..." : "Create product"}
        </button>
      </form>
    </section>
  );
}
