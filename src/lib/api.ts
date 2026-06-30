import type {
  ApiResponse,
  Branding,
  Category,
  CategoryPayload,
  FulfillmentStatus,
  InventoryAdjustPayload,
  ListResult,
  LowStockReport,
  Order,
  OrderStatus,
  PaymentStatus,
  Product,
  ProductAttributeSchema,
  ProductFacets,
  ProductPayload,
  ProductStatus,
  ProductUpdatePayload,
  Slider,
  SliderPayload,
  TenantWorkspace,
  Warehouse,
  WarehousePayload,
  ShippingMethod,
  ShippingMethodPayload,
  Collection,
  CollectionPayload,
  Campaign,
  CampaignPayload,
} from "../types";
import { clearSession, getStoredSession, notifySessionExpired } from "./session";

const API_URL =
  import.meta.env.VITE_API_URL?.trim().replace(/\/+$/, "") ||
  "http://localhost:4000/api/v1";

const DEFAULT_TENANT_ID = import.meta.env.VITE_TENANT_ID || "devtenant";
const REQUEST_TIMEOUT_MS = 20_000;

type Query = Record<string, string | number | boolean | undefined>;
type ApiRequestOptions = RequestInit & {
  tenantMode?: "session" | "none";
};

const toQueryString = (query?: Query) => {
  if (!query) return "";
  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== "") {
      params.set(key, String(value));
    }
  });
  const text = params.toString();
  return text ? `?${text}` : "";
};

const readErrorMessage = async (response: Response) => {
  const text = await response.text();
  if (!text) return `Request failed (${response.status})`;
  try {
    const data = JSON.parse(text) as {
      message?: string;
      error?: string;
      errorSources?: Array<{ message?: string }>;
    };
    const fieldMessage = data.errorSources
      ?.map((source) => source.message)
      .filter(Boolean)
      .join(", ");
    return (
      data.message ||
      data.error ||
      fieldMessage ||
      `Request failed (${response.status})`
    );
  } catch {
    return text;
  }
};

const parseJsonResponse = async <T>(response: Response): Promise<ApiResponse<T>> => {
  const text = await response.text();
  if (!text) {
    return { success: response.ok, data: null as T };
  }

  let parsed: ApiResponse<T>;
  try {
    parsed = JSON.parse(text) as ApiResponse<T>;
  } catch {
    throw new Error("The API returned an invalid JSON response");
  }

  if (parsed.success === false) {
    throw new Error(parsed.message || "Request failed");
  }

  return parsed;
};

export const getTenantId = () =>
  getStoredSession()?.tenantId || DEFAULT_TENANT_ID;

export async function apiRequest<T>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<ApiResponse<T>> {
  const session = getStoredSession();
  const { tenantMode = "session", ...requestOptions } = options;
  const headers = new Headers(requestOptions.headers);
  const controller = new AbortController();
  let timedOut = false;

  if (!(requestOptions.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  if (tenantMode === "session" && !headers.has("x-tenant-id")) {
    headers.set("x-tenant-id", session?.tenantId || DEFAULT_TENANT_ID);
  }
  if (session?.token) {
    headers.set("Authorization", `Bearer ${session.token}`);
  }

  const timeout = window.setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, REQUEST_TIMEOUT_MS);

  if (requestOptions.signal) {
    if (requestOptions.signal.aborted) {
      controller.abort();
    } else {
      requestOptions.signal.addEventListener("abort", () => controller.abort(), {
        once: true,
      });
    }
  }

  try {
    const response = await fetch(`${API_URL}${path}`, {
      ...requestOptions,
      headers,
      signal: controller.signal,
    });

    if (!response.ok) {
      if (response.status === 401) {
        clearSession();
        notifySessionExpired();
      }
      throw new Error(await readErrorMessage(response));
    }

    return await parseJsonResponse<T>(response);
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error(
        timedOut
          ? "Request timed out. Check that Base360 is running and reachable."
          : "Request was cancelled",
      );
    }
    if (error instanceof TypeError) {
      throw new Error("Unable to reach the Base360 API. Check the server and CORS.");
    }
    throw error;
  } finally {
    window.clearTimeout(timeout);
  }
}

export async function login(email: string, password: string, tenantId?: string) {
  return apiRequest<{ accessToken: string; tenantId: string }>("/auth/login", {
    method: "POST",
    tenantMode: "none",
    headers: tenantId ? { "x-tenant-id": tenantId } : undefined,
    body: JSON.stringify({ email, password }),
  });
}

export async function getMe() {
  return apiRequest<unknown>("/users/me");
}

export async function healthCheck() {
  return apiRequest<{ status?: string; uptime?: number; timestamp?: string }>(
    "/health",
    { tenantMode: "none" },
  );
}

const list = async <T>(
  path: string,
  query?: Query,
): Promise<ListResult<T>> => {
  const response = await apiRequest<T[]>(`${path}${toQueryString(query)}`);
  return {
    rows: Array.isArray(response.data) ? response.data : [],
    meta: response.meta || {},
  };
};

const normalizeLowStockReport = (data: unknown): LowStockReport => {
  const report = data as Partial<LowStockReport> | undefined;
  return {
    products: Array.isArray(report?.products) ? report.products : [],
    variants: Array.isArray(report?.variants) ? report.variants : [],
    warehouses: Array.isArray(report?.warehouses) ? report.warehouses : [],
  };
};

export const ecommerceApi = {
  currentTenant: () => apiRequest<TenantWorkspace>("/tenants/current"),
  products: (query?: Query) =>
    list<Product>("/ecommerce/products", { limit: 50, ...query }),
  productAdmin: (id: string) =>
    apiRequest<Product>(`/ecommerce/products/admin/${id}`),
  productFacets: async () => {
    const response = await apiRequest<ProductFacets>(
      "/ecommerce/products/facets",
    );
    return response.data;
  },
  productAttributeSchemas: async () => {
    const response = await apiRequest<ProductAttributeSchema[]>(
      "/ecommerce/products/attribute-schemas",
    );
    return Array.isArray(response.data) ? response.data : [];
  },
  createProduct: (payload: ProductPayload) =>
    apiRequest<Product>("/ecommerce/products/create-product", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  createProductForm: (formData: FormData) =>
    apiRequest<Product>("/ecommerce/products/create-product", {
      method: "POST",
      body: formData,
    }),
  updateProduct: (id: string, payload: ProductUpdatePayload) =>
    apiRequest<Product>(`/ecommerce/products/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),
  updateProductForm: (id: string, formData: FormData) =>
    apiRequest<Product>(`/ecommerce/products/${id}`, {
      method: "PATCH",
      body: formData,
    }),
  createProductOverride: (id: string, payload: ProductUpdatePayload) =>
    apiRequest<Product>(`/ecommerce/products/${id}/override`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  deleteProduct: (id: string) =>
    apiRequest<Product>(`/ecommerce/products/${id}`, {
      method: "DELETE",
    }),
  adjustProductInventory: (id: string, payload: InventoryAdjustPayload) =>
    apiRequest<Product>(`/ecommerce/products/${id}/inventory/adjust`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  categories: (query?: Query) =>
    list<Category>("/ecommerce/categories", { limit: 50, ...query }),
  categoryTree: async () => {
    const response = await apiRequest<Category[]>("/ecommerce/categories/tree");
    return Array.isArray(response.data) ? response.data : [];
  },
  createCategory: (payload: CategoryPayload) =>
    apiRequest<Category>("/ecommerce/categories/create-category", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  createCategoryForm: (formData: FormData) =>
    apiRequest<Category>("/ecommerce/categories/create-category", {
      method: "POST",
      body: formData,
    }),
  updateCategory: (id: string, payload: Partial<CategoryPayload>) =>
    apiRequest<Category>(`/ecommerce/categories/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),
  deleteCategory: (id: string) =>
    apiRequest<Category>(`/ecommerce/categories/${id}`, {
      method: "DELETE",
    }),
  orders: (query?: Query) =>
    list<Order>("/ecommerce/orders", { limit: 50, ...query }),
  lowStock: async () => {
    const response = await apiRequest<LowStockReport | unknown>(
      "/ecommerce/products/inventory/low-stock",
    );
    return normalizeLowStockReport(response.data);
  },
  warehouses: () => list<Warehouse>("/ecommerce/warehouses"),
  createWarehouse: (payload: WarehousePayload) =>
    apiRequest<Warehouse>("/ecommerce/warehouses", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  updateWarehouse: (id: string, payload: Partial<WarehousePayload>) =>
    apiRequest<Warehouse>(`/ecommerce/warehouses/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),
  deleteWarehouse: (id: string) =>
    apiRequest<Warehouse>(`/ecommerce/warehouses/${id}`, {
      method: "DELETE",
    }),
  sliders: (query?: Query) =>
    list<Slider>("/ecommerce/sliders", { limit: 50, ...query }),
  createSlider: (payload: SliderPayload) =>
    apiRequest<Slider>("/ecommerce/sliders/create-slider", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  createSliderForm: (formData: FormData) =>
    apiRequest<Slider>("/ecommerce/sliders/create-slider", {
      method: "POST",
      body: formData,
    }),
  updateSlider: (id: string, payload: Partial<SliderPayload>) =>
    apiRequest<Slider>(`/ecommerce/sliders/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),
  deleteSlider: (id: string) =>
    apiRequest<Slider>(`/ecommerce/sliders/${id}`, {
      method: "DELETE",
    }),
  branding: () => apiRequest<Branding>("/ecommerce/branding"),
  updateBranding: (payload: Partial<Branding>) =>
    apiRequest<Branding>("/ecommerce/branding", {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),
  updateBrandingForm: (formData: FormData) =>
    apiRequest<Branding>("/ecommerce/branding", {
      method: "PATCH",
      body: formData,
    }),
  updateProductStatus: (id: string, status: ProductStatus) =>
    apiRequest<Product>(`/ecommerce/products/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),
  updateOrderStatus: (
    id: string,
    payload: {
      status?: OrderStatus;
      paymentStatus?: PaymentStatus;
      fulfillmentStatus?: FulfillmentStatus;
      note?: string;
    },
  ) =>
    apiRequest<Order>(`/ecommerce/orders/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),
  shippingMethods: () => list<ShippingMethod>("/ecommerce/shipping-methods"),
  createShippingMethod: (payload: ShippingMethodPayload) =>
    apiRequest<ShippingMethod>("/ecommerce/shipping-methods", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  updateShippingMethod: (id: string, payload: Partial<ShippingMethodPayload>) =>
    apiRequest<ShippingMethod>(`/ecommerce/shipping-methods/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),
  deleteShippingMethod: (id: string) =>
    apiRequest<ShippingMethod>(`/ecommerce/shipping-methods/${id}`, {
      method: "DELETE",
    }),
  collections: () => list<Collection>("/ecommerce/collections"),
  createCollection: (payload: CollectionPayload) =>
    apiRequest<Collection>("/ecommerce/collections", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  updateCollection: (id: string, payload: Partial<CollectionPayload>) =>
    apiRequest<Collection>(`/ecommerce/collections/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),
  deleteCollection: (id: string) =>
    apiRequest<Collection>(`/ecommerce/collections/${id}`, {
      method: "DELETE",
    }),
  campaigns: () => list<Campaign>("/ecommerce/campaigns"),
  createCampaign: (payload: CampaignPayload) =>
    apiRequest<Campaign>("/ecommerce/campaigns", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  updateCampaign: (id: string, payload: Partial<CampaignPayload>) =>
    apiRequest<Campaign>(`/ecommerce/campaigns/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),
  deleteCampaign: (id: string) =>
    apiRequest<Campaign>(`/ecommerce/campaigns/${id}`, {
      method: "DELETE",
    }),
};
