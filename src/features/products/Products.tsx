import { type FormEvent, useCallback, useEffect, useState } from "react";
import {
  ArrowLeft,
  Boxes,
  Check,
  CircleDollarSign,
  Download,
  FileText,
  Layers3,
  PackageCheck,
  Plus,
  RefreshCw,
  Save,
  Search,
  ShoppingBag,
  Sparkles,
  Tags,
  TriangleAlert,
  Trash2,
  Truck,
  X,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { ecommerceApi } from "../../lib/api";
import type {
  ApiMeta,
  Category,
  Product,
  ProductAttributeSchema,
  ProductFaq,
  ProductFacets,
  ProductFile,
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
import { ImageUploadField } from "../../shared/ui/ImageUploadField";
import { DataPage, MetricCard, Pagination, PanelTitle, SearchBox } from "../../shared/ui/page";

type CategoryChoice = {
  id: string;
  name: string;
  path: string;
  depth: number;
};

const flattenCategories = (
  categories: Category[],
  parentPath = "",
  depth = 0,
): CategoryChoice[] =>
  categories.flatMap((category) => {
    const path = parentPath ? `${parentPath} / ${category.name}` : category.name;
    return [
      { id: category._id, name: category.name, path, depth },
      ...flattenCategories(category.children || [], path, depth + 1),
    ];
  });

const categoryId = (category: string | { _id: string }) =>
  typeof category === "string" ? category : category._id;

const variantCombinations = (options: ProductOption[]) => {
  const validOptions = options.filter(
    (option) => option.name.trim() && option.values.length,
  );
  if (!validOptions.length) return [];

  return validOptions.reduce<Array<Record<string, string>>>(
    (combinations, option) =>
      combinations.flatMap((combination) =>
        option.values.map((value) => ({
          ...combination,
          [option.name.trim()]: value,
        })),
      ),
    [{}],
  );
};

const skuPart = (value: string) =>
  value
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

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
  const [categoryFilter, setCategoryFilter] = useState("");
  const [brandFilter, setBrandFilter] = useState("");
  const [categoryTree, setCategoryTree] = useState<Category[]>([]);
  const [attributeSchemas, setAttributeSchemas] = useState<ProductAttributeSchema[]>(
    [],
  );
  const [facets, setFacets] = useState<ProductFacets>({
    brands: [],
    tags: [],
    categories: [],
    attributes: [],
  });
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
        category: categoryFilter || undefined,
        brand: brandFilter || undefined,
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
    brandFilter,
    categoryFilter,
    includeGlobal,
    page,
    status,
    stockFilter,
  ]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const loadMetadata = async () => {
      try {
        const [categories, schemas, productFacets] = await Promise.all([
          ecommerceApi.categoryTree(),
          ecommerceApi.productAttributeSchemas(),
          ecommerceApi.productFacets(),
        ]);
        setCategoryTree(categories);
        setAttributeSchemas(schemas);
        setFacets(productFacets);
      } catch (err) {
        setError(getErrorMessage(err, "Product filters could not be loaded"));
      }
    };
    void loadMetadata();
  }, []);

  useEffect(() => {
    setPage(1);
  }, [
    debouncedMaxPrice,
    debouncedMinPrice,
    debouncedSearch,
    brandFilter,
    categoryFilter,
    includeGlobal,
    status,
    stockFilter,
  ]);

  const openProduct = async (product: Product) => {
    setPendingId(product._id);
    setError("");
    try {
      if (product.scope === "global") {
        setSelectedProduct(product);
        return;
      }
      const response = await ecommerceApi.productAdmin(product._id);
      setSelectedProduct(response.data);
    } catch (err) {
      setError(getErrorMessage(err, "Product details could not be loaded"));
    } finally {
      setPendingId("");
    }
  };

  const categoryChoices = flattenCategories(categoryTree);

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
          <Link className="primary-button" to="/products/new">
            <Plus size={16} />
            New product
          </Link>
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
          <label>
            Category
            <select
              value={categoryFilter}
              onChange={(event) => setCategoryFilter(event.target.value)}
            >
              <option value="">All categories</option>
              {categoryChoices.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.path}
                </option>
              ))}
            </select>
          </label>
          <label>
            Brand
            <select
              value={brandFilter}
              onChange={(event) => setBrandFilter(event.target.value)}
            >
              <option value="">All brands</option>
              {facets.brands.map((brand) => (
                <option key={brand.value} value={brand.value}>
                  {brand.value} ({brand.count})
                </option>
              ))}
            </select>
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
      {selectedProduct && (
        <ProductEditPanel
          product={selectedProduct}
          categoryTree={categoryTree}
          attributeSchemas={attributeSchemas}
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
                      disabled={pendingId === product._id}
                      onClick={() => void openProduct(product)}
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
  categoryTree,
  attributeSchemas,
  mode = "edit",
  onClose,
  onSaved,
  onArchived,
}: {
  product: Product;
  categoryTree: Category[];
  attributeSchemas: ProductAttributeSchema[];
  mode?: "create" | "edit";
  onClose: () => void;
  onSaved: (product: Product) => Promise<void>;
  onArchived: () => void;
}) {
  const [activeTab, setActiveTab] = useState<ProductEditorTab>("Overview");
  const [productType, setProductType] = useState<
    "physical" | "digital" | "service"
  >(product.productType || "physical");
  const [name, setName] = useState(product.name || "");
  const [slug, setSlug] = useState(product.slug || "");
  const [sku, setSku] = useState(product.sku || "");
  const [barcode, setBarcode] = useState(product.barcode || "");
  const [brand, setBrand] = useState(product.brand || "");
  const [categoryIds, setCategoryIds] = useState(
    (product.categories || []).map(categoryId),
  );
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
  const [replaceImages, setReplaceImages] = useState(true);
  const [imageUploads, setImageUploads] = useState<File[]>([]);
  const [productFiles, setProductFiles] = useState<ProductFile[]>(
    product.files?.length
      ? product.files
      : [{ name: "", url: "", type: "", isPublic: false }],
  );
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
    setProductType(product.productType || "physical");
    setName(product.name || "");
    setSlug(product.slug || "");
    setSku(product.sku || "");
    setBarcode(product.barcode || "");
    setBrand(product.brand || "");
    setCategoryIds((product.categories || []).map(categoryId));
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
    setReplaceImages(true);
    setImageUploads([]);
    setProductFiles(
      product.files?.length
        ? product.files
        : [{ name: "", url: "", type: "", isPublic: false }],
    );
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
    const normalizedVariants = variants
      .map((variant) => ({
        sku: variant.sku?.trim() || undefined,
        barcode: variant.barcode?.trim() || undefined,
        price: variant.price,
        salePrice: variant.salePrice,
        stock: variant.stock,
        lowStockThreshold: variant.lowStockThreshold,
        image: variant.image?.trim() || undefined,
        isActive: variant.isActive !== false,
        attributes: variant.attributes,
      }))
      .filter((variant) => variant.sku || variant.price !== undefined);
    const variantSkus = normalizedVariants
      .map((variant) => variant.sku)
      .filter((value): value is string => Boolean(value));
    if (new Set(variantSkus).size !== variantSkus.length) {
      throw new Error("Every variant must have a unique SKU");
    }
    normalizedVariants.forEach((variant) => {
      if (
        variant.salePrice !== undefined &&
        variant.price !== undefined &&
        variant.salePrice > variant.price
      ) {
        throw new Error(`Sale price is higher than price for ${variant.sku}`);
      }
    });

    const clearFields = [
      !salePrice.trim() && product.salePrice !== undefined ? "salePrice" : "",
      !costPrice.trim() && product.costPrice !== undefined ? "costPrice" : "",
      !barcode.trim() && product.barcode ? "barcode" : "",
      !brand.trim() && product.brand ? "brand" : "",
      !weight.trim() && product.weight !== undefined ? "weight" : "",
      !length.trim() &&
      !width.trim() &&
      !height.trim() &&
      product.dimensions
        ? "dimensions"
        : "",
      !shortDescription.trim() && product.shortDescription
        ? "shortDescription"
        : "",
      !description.trim() && product.description ? "description" : "",
      !thumbnail.trim() && product.thumbnail ? "thumbnail" : "",
      !attributes.trim() &&
      product.attributes &&
      Object.keys(product.attributes).length
        ? "attributes"
        : "",
      !seoTitle.trim() &&
      !seoDescription.trim() &&
      !seoKeywords.trim() &&
      product.seo
        ? "seo"
        : "",
    ].filter(Boolean);

    return {
      productType,
      name,
      slug: slug || undefined,
      sku: sku || undefined,
      barcode: barcode.trim(),
      brand: brand.trim(),
      categories: categoryIds,
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
      replaceImages,
      files: productFiles
        .map((file) => ({
          name: file.name.trim(),
          url: file.url.trim(),
          type: file.type?.trim() || undefined,
          size: file.size,
          isPublic: Boolean(file.isPublic),
        }))
        .filter((file) => file.name && file.url),
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
      variants: normalizedVariants,
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
      clearFields,
    };
  };

  const save = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const payload = buildPayload();
      let response;
      if (mode === "create") {
        if (imageUploads?.length) {
          const formData = new FormData();
          Object.entries(payload).forEach(([key, value]) => {
            if (value === undefined) return;
            if (typeof value === "object") {
              formData.set(key, JSON.stringify(value));
            } else {
              formData.set(key, String(value));
            }
          });
          imageUploads.forEach((file) =>
            formData.append("images", file),
          );
          response = await ecommerceApi.createProductForm(formData);
        } else {
          response = await ecommerceApi.createProduct(payload);
        }
      } else if (product.scope === "global") {
        response = await ecommerceApi.createProductOverride(product._id, payload);
      } else if (imageUploads?.length) {
        const formData = new FormData();
        Object.entries(payload).forEach(([key, value]) => {
          if (value === undefined) return;
          if (typeof value === "object") {
            formData.set(key, JSON.stringify(value));
          } else {
            formData.set(key, String(value));
          }
        });
        imageUploads.forEach((file) =>
          formData.append("images", file),
        );
        response = await ecommerceApi.updateProductForm(product._id, formData);
      } else {
        response = await ecommerceApi.updateProduct(product._id, payload);
      }

      if (inventoryDelta.trim()) {
        const delta = Number(inventoryDelta);
        if (!Number.isFinite(delta) || delta === 0) {
          throw new Error("Stock adjustment must be a non-zero number");
        }
        await ecommerceApi.adjustProductInventory(response.data._id, {
          delta,
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

  const setProductFile = (index: number, patch: Partial<ProductFile>) => {
    setProductFiles((current) =>
      current.map((file, fileIndex) =>
        fileIndex === index ? { ...file, ...patch } : file,
      ),
    );
  };

  const setAttribute = (key: string, value: string) => {
    const next = { ...(attributesFromText(attributes) || {}) };
    if (value) next[key] = value;
    else delete next[key];
    setAttributes(textFromAttributes(next));
  };

  const toggleCategory = (id: string) => {
    setCategoryIds((current) =>
      current.includes(id)
        ? current.filter((category) => category !== id)
        : [...current, id],
    );
  };

  const generateVariants = () => {
    setError("");
    const combinations = variantCombinations(options);
    if (!combinations.length) {
      setError("Add at least one option with values before generating variants");
      return;
    }
    if (combinations.length > 100) {
      setError("This option set creates more than 100 variants");
      return;
    }

    const byAttributes = new Map(
      variants.map((variant) => [
        JSON.stringify(variant.attributes || {}),
        variant,
      ]),
    );
    const baseSku = skuPart(sku || name || "PRODUCT");
    setVariants(
      combinations.map((combination) => {
        const existing = byAttributes.get(JSON.stringify(combination));
        return (
          existing || {
            sku: [baseSku, ...Object.values(combination).map(skuPart)]
              .filter(Boolean)
              .join("-"),
            price: numberOrUndefined(price),
            stock: 0,
            lowStockThreshold: numberOrUndefined(lowStockThreshold),
            attributes: combination,
            isActive: true,
          }
        );
      }),
    );
  };

  const categoryChoices = flattenCategories(categoryTree);
  const readiness = [
    { label: "Identity", ready: Boolean(name.trim() && sku.trim()) },
    { label: "Category", ready: categoryIds.length > 0 },
    { label: "Pricing", ready: numberOrUndefined(price) !== undefined },
    {
      label: "Content",
      ready: Boolean(shortDescription.trim() || description.trim()),
    },
    {
      label: "Media",
      ready: Boolean(thumbnail.trim() || images.trim() || imageUploads?.length),
    },
    {
      label: "SEO",
      ready: Boolean(seoTitle.trim() && seoDescription.trim()),
    },
  ];
  const readyCount = readiness.filter((item) => item.ready).length;
  const readinessPercent = Math.round((readyCount / readiness.length) * 100);

  return (
    <section className="product-editor panel">
      <form onSubmit={save}>
        <div className="product-editor-head">
          <div className="product-cell">
            <ProductThumb product={{ ...product, thumbnail }} />
            <div>
              <h3>{name || product.name || "New product"}</h3>
              <span>{sku || "No SKU"} / {product.scope || "tenant"}</span>
            </div>
          </div>
          <div className="row-actions">
            <button className="ghost-button" type="button" onClick={onClose}>
              <X size={16} />
              Close
            </button>
            {mode === "edit" && product.scope !== "global" && (
              <button
                className="icon-button danger"
                type="button"
                onClick={onArchived}
                aria-label="Archive product"
                title="Archive product"
              >
                <Trash2 size={16} />
              </button>
            )}
            <button className="primary-button" type="submit" disabled={saving}>
              <Save size={16} />
              {saving
                ? "Saving..."
                : mode === "create"
                  ? "Create product"
                  : product.scope === "global"
                  ? "Create store override"
                  : "Save product"}
            </button>
          </div>
        </div>

        {error && <ErrorBanner message={error} />}

        <div className="product-readiness">
          <div className="readiness-summary">
            <div>
              <span>Product readiness</span>
              <strong>{readinessPercent}%</strong>
            </div>
            <div className="readiness-track" aria-hidden="true">
              <span style={{ width: `${readinessPercent}%` }} />
            </div>
          </div>
          <div className="readiness-checks">
            {readiness.map((item) => (
              <span className={item.ready ? "ready" : ""} key={item.label}>
                <Check size={13} />
                {item.label}
              </span>
            ))}
          </div>
        </div>

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
              Product type
              <select
                value={productType}
                onChange={(event) =>
                  setProductType(
                    event.target.value as "physical" | "digital" | "service",
                  )
                }
              >
                <option value="physical">Physical</option>
                <option value="digital">Digital</option>
                <option value="service">Service</option>
              </select>
            </label>
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
            <div className="form-wide category-picker">
              <div className="field-heading">
                <div>
                  <strong>Categories</strong>
                  <span>{categoryIds.length} selected</span>
                </div>
                <Layers3 size={18} />
              </div>
              <div className="category-choice-list">
                {categoryChoices.map((category) => (
                  <label
                    className="category-choice"
                    key={category.id}
                    style={{ paddingLeft: `${12 + category.depth * 18}px` }}
                  >
                    <input
                      checked={categoryIds.includes(category.id)}
                      onChange={() => toggleCategory(category.id)}
                      type="checkbox"
                    />
                    <span>{category.path}</span>
                  </label>
                ))}
                {!categoryChoices.length && (
                  <span className="muted-note">No active categories</span>
                )}
              </div>
            </div>
            <label className="form-wide">
              Tags
              <input value={tags} onChange={(event) => setTags(event.target.value)} />
            </label>
            {attributeSchemas.length ? (
              attributeSchemas.map((schema) => {
                const value = attributesFromText(attributes)?.[schema.key] || "";
                return (
                  <label key={schema._id}>
                    {schema.key}
                    {schema.type === "enum" ? (
                      <select
                        required={schema.required}
                        value={value}
                        onChange={(event) =>
                          setAttribute(schema.key, event.target.value)
                        }
                      >
                        <option value="">Select value</option>
                        {(schema.allowedValues || []).map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    ) : schema.type === "boolean" ? (
                      <select
                        required={schema.required}
                        value={value}
                        onChange={(event) =>
                          setAttribute(schema.key, event.target.value)
                        }
                      >
                        <option value="">Select value</option>
                        <option value="true">Yes</option>
                        <option value="false">No</option>
                      </select>
                    ) : (
                      <input
                        required={schema.required}
                        type={schema.type === "number" ? "number" : "text"}
                        value={value}
                        onChange={(event) =>
                          setAttribute(schema.key, event.target.value)
                        }
                      />
                    )}
                  </label>
                );
              })
            ) : (
              <label className="form-wide">
                Attributes
                <textarea
                  value={attributes}
                  onChange={(event) => setAttributes(event.target.value)}
                  placeholder={"material: Cotton\nfit: Regular"}
                />
              </label>
            )}
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
                <button
                  className="icon-button danger"
                  type="button"
                  onClick={() =>
                    setOptions((current) =>
                      current.filter((_, optionIndex) => optionIndex !== index),
                    )
                  }
                  aria-label="Remove option"
                  title="Remove option"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
            <div className="editor-actions form-wide">
              <button className="ghost-button" type="button" onClick={() => setOptions((current) => [...current, { name: "", values: [] }])}>
                <Plus size={16} />
                Add option
              </button>
              <button className="ghost-button" type="button" onClick={generateVariants}>
                <Sparkles size={16} />
                Generate variants
              </button>
            </div>
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
            <div className="form-wide">
              <ImageUploadField
                title="Upload product media"
                files={imageUploads}
                onFilesChange={setImageUploads}
                existingUrls={[thumbnail, ...images.split("\n")].filter(Boolean)}
                multiple
              />
            </div>
            <label className="check-row form-wide">
              <input
                checked={replaceImages}
                onChange={(event) => setReplaceImages(event.target.checked)}
                type="checkbox"
              />
              Treat this gallery as the complete image set
            </label>
          </div>
        )}

        {activeTab === "File" && (
          <div className="attachment-list">
            {productFiles.map((file, index) => (
              <div className="attachment-row" key={`file-${index}`}>
                <FileText size={18} />
                <label>
                  Name
                  <input
                    value={file.name}
                    onChange={(event) =>
                      setProductFile(index, { name: event.target.value })
                    }
                    placeholder="Size guide"
                  />
                </label>
                <label>
                  File URL
                  <input
                    value={file.url}
                    onChange={(event) =>
                      setProductFile(index, { url: event.target.value })
                    }
                    placeholder="https://..."
                    type="url"
                  />
                </label>
                <label>
                  Type
                  <input
                    value={file.type || ""}
                    onChange={(event) =>
                      setProductFile(index, { type: event.target.value })
                    }
                    placeholder="PDF"
                  />
                </label>
                <label className="check-row">
                  <input
                    checked={Boolean(file.isPublic)}
                    onChange={(event) =>
                      setProductFile(index, {
                        isPublic: event.target.checked,
                      })
                    }
                    type="checkbox"
                  />
                  Public
                </label>
                {file.url && (
                  <a
                    className="icon-button"
                    href={file.url}
                    rel="noreferrer"
                    target="_blank"
                    aria-label="Open file"
                    title="Open file"
                  >
                    <Download size={16} />
                  </a>
                )}
                <button
                  className="icon-button danger"
                  type="button"
                  onClick={() =>
                    setProductFiles((current) =>
                      current.filter((_, fileIndex) => fileIndex !== index),
                    )
                  }
                  aria-label="Remove file"
                  title="Remove file"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
            <button
              className="ghost-button"
              type="button"
              onClick={() =>
                setProductFiles((current) => [
                  ...current,
                  { name: "", url: "", type: "", isPublic: false },
                ])
              }
            >
              <Plus size={16} />
              Add file
            </button>
          </div>
        )}

        {activeTab === "Variant" && (
          <div className="variant-list">
            <div className="section-command">
              <div>
                <strong>{variants.length} variants</strong>
                <span>Generated from product options or managed manually</span>
              </div>
              <button className="ghost-button" type="button" onClick={generateVariants}>
                <Sparkles size={16} />
                Generate from options
              </button>
            </div>
            {variants.map((variant, index) => (
              <div className="variant-row" key={`variant-${index}`}>
                <div className="variant-heading">
                  <div className="variant-attributes">
                    {Object.entries(variant.attributes || {}).map(([key, value]) => (
                      <span key={key}>{key}: {value}</span>
                    ))}
                    {!Object.keys(variant.attributes || {}).length && (
                      <span>Manual variant</span>
                    )}
                  </div>
                  <button
                    className="icon-button danger"
                    type="button"
                    onClick={() =>
                      setVariants((current) =>
                        current.filter(
                          (_, variantIndex) => variantIndex !== index,
                        ),
                      )
                    }
                    aria-label="Remove variant"
                    title="Remove variant"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
                <label>SKU<input value={variant.sku || ""} onChange={(event) => setVariant(index, { sku: event.target.value })} /></label>
                <label>Barcode<input value={variant.barcode || ""} onChange={(event) => setVariant(index, { barcode: event.target.value })} /></label>
                <label>Price<input value={variant.price ?? ""} onChange={(event) => setVariant(index, { price: numberOrUndefined(event.target.value) })} type="number" min="0" /></label>
                <label>Sale price<input value={variant.salePrice ?? ""} onChange={(event) => setVariant(index, { salePrice: numberOrUndefined(event.target.value) })} type="number" min="0" /></label>
                <label>Stock<input value={variant.stock ?? ""} onChange={(event) => setVariant(index, { stock: numberOrUndefined(event.target.value) })} type="number" min="0" /></label>
                <label>Low stock<input value={variant.lowStockThreshold ?? ""} onChange={(event) => setVariant(index, { lowStockThreshold: numberOrUndefined(event.target.value) })} type="number" min="0" /></label>
                <label className="variant-image-field">Image URL<input value={variant.image || ""} onChange={(event) => setVariant(index, { image: event.target.value })} type="url" /></label>
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
                <button
                  className="icon-button danger"
                  type="button"
                  onClick={() =>
                    setFaqs((current) =>
                      current.filter((_, faqIndex) => faqIndex !== index),
                    )
                  }
                  aria-label="Remove FAQ"
                  title="Remove FAQ"
                >
                  <Trash2 size={15} />
                </button>
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

const emptyProduct: Product = {
  _id: "new",
  name: "",
  price: 0,
  productType: "physical",
  status: "draft",
  trackStock: true,
  stock: 0,
  currency: "USD",
  categories: [],
  images: [],
  files: [],
  options: [],
  variants: [],
  faqs: [],
};

export function ProductCreatePage() {
  const navigate = useNavigate();
  const [categoryTree, setCategoryTree] = useState<Category[]>([]);
  const [attributeSchemas, setAttributeSchemas] = useState<ProductAttributeSchema[]>(
    [],
  );
  const [error, setError] = useState("");

  useEffect(() => {
    const loadMetadata = async () => {
      try {
        const [categories, schemas] = await Promise.all([
          ecommerceApi.categoryTree(),
          ecommerceApi.productAttributeSchemas(),
        ]);
        setCategoryTree(categories);
        setAttributeSchemas(schemas);
      } catch (err) {
        setError(getErrorMessage(err, "Product setup data could not be loaded"));
      }
    };
    void loadMetadata();
  }, []);

  return (
    <DataPage
      title="Create product"
      detail="Build a complete catalog item, then publish when it is ready"
      actions={
        <Link className="ghost-button" to="/products">
          <ArrowLeft size={16} />
          Product list
        </Link>
      }
    >
      {error && <ErrorBanner message={error} />}
      <ProductEditPanel
        product={emptyProduct}
        categoryTree={categoryTree}
        attributeSchemas={attributeSchemas}
        mode="create"
        onClose={() => navigate("/products")}
        onArchived={() => undefined}
        onSaved={async () => navigate("/products")}
      />
    </DataPage>
  );
}
