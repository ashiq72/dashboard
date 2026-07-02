export type ApiMeta = {
  page?: number;
  limit?: number;
  total?: number;
  totalPage?: number;
  totalPages?: number;
  [key: string]: unknown;
};

export type ApiResponse<T> = {
  success: boolean;
  message?: string;
  data: T;
  meta?: ApiMeta;
};

export type SessionUser = {
  userId?: string;
  _id?: string;
  name?: string;
  email?: string;
  role?: string;
  tenantId?: string;
  exp?: number;
};

export type AuthSession = {
  token: string;
  tenantId: string;
  user?: SessionUser;
};

export type TenantWorkspace = {
  tenantId: string;
  email?: string | null;
  domain?: string | null;
  subdomain?: string | null;
  status: "active" | "disabled";
  plan?: "basic" | "business" | "pro";
  region?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type ProductStatus = "draft" | "active" | "archived";
export type ProductListStatus = ProductStatus | "inactive" | "all";

export type ProductOption = {
  name: string;
  values: string[];
};

export type ProductVariant = {
  sku?: string;
  barcode?: string;
  price?: number;
  salePrice?: number;
  stock?: number;
  reserved?: number;
  lowStockThreshold?: number;
  attributes?: Record<string, string>;
  image?: string;
  isActive?: boolean;
};

export type ProductDimensions = {
  length?: number;
  width?: number;
  height?: number;
  unit?: string;
};

export type ProductFaq = {
  question: string;
  answer: string;
};

export type ProductSeo = {
  title?: string;
  description?: string;
  keywords?: string[];
};

export type ProductFile = {
  name: string;
  url: string;
  type?: string;
  size?: number;
  isPublic?: boolean;
};

export type Product = {
  _id: string;
  productType?: "physical" | "digital" | "service";
  name: string;
  slug?: string;
  description?: string;
  shortDescription?: string;
  features?: string[];
  sku?: string;
  barcode?: string;
  brand?: string;
  tags?: string[];
  price: number;
  salePrice?: number;
  costPrice?: number;
  currency?: string;
  stock?: number;
  reserved?: number;
  lowStockThreshold?: number;
  trackStock?: boolean;
  status?: ProductStatus;
  isActive?: boolean;
  isFeatured?: boolean;
  scope?: "tenant" | "global";
  thumbnail?: string;
  images?: string[];
  files?: ProductFile[];
  categories?: Array<string | CategoryRef>;
  weight?: number;
  dimensions?: ProductDimensions;
  options?: ProductOption[];
  variants?: ProductVariant[];
  attributes?: Record<string, string>;
  faqs?: ProductFaq[];
  seo?: ProductSeo;
  createdAt?: string;
  updatedAt?: string;
};

export type ProductPayload = {
  name: string;
  productType?: "physical" | "digital" | "service";
  slug?: string;
  description?: string;
  shortDescription?: string;
  features?: string[];
  sku?: string;
  barcode?: string;
  brand?: string;
  tags?: string[];
  price: number;
  salePrice?: number;
  costPrice?: number;
  currency?: string;
  stock?: number;
  lowStockThreshold?: number;
  reserved?: number;
  thumbnail?: string;
  images?: string[];
  files?: ProductFile[];
  categories?: string[];
  status?: ProductStatus;
  trackStock?: boolean;
  isFeatured?: boolean;
  weight?: number;
  dimensions?: ProductDimensions;
  options?: ProductOption[];
  variants?: ProductVariant[];
  attributes?: Record<string, string>;
  faqs?: ProductFaq[];
  seo?: ProductSeo;
  replaceImages?: boolean;
  clearFields?: string[];
};

export type ProductUpdatePayload = Partial<ProductPayload>;

export type InventoryAdjustPayload = {
  delta: number;
  variantSku?: string;
  warehouseId?: string;
  reason?: string;
  note?: string;
};

export type ProductFacet = {
  value: string;
  count: number;
};

export type ProductFacets = {
  brands: ProductFacet[];
  tags: ProductFacet[];
  categories: Array<{
    id: string;
    name?: string;
    slug?: string;
    count: number;
  }>;
  attributes: Array<{
    key: string;
    values: ProductFacet[];
  }>;
};

export type ProductAttributeSchema = {
  _id: string;
  key: string;
  type: "string" | "number" | "boolean" | "enum";
  required?: boolean;
  allowedValues?: string[];
  description?: string;
};

export type OrderStatus =
  | "pending"
  | "paid"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "refunded";

export type PaymentStatus =
  | "unpaid"
  | "authorized"
  | "paid"
  | "refunded"
  | "failed";

export type FulfillmentStatus =
  | "unfulfilled"
  | "partial"
  | "fulfilled"
  | "returned";

export type Order = {
  _id: string;
  orderNumber?: string;
  customer?: {
    name?: string;
    email?: string;
    phone?: string;
  };
  total?: number;
  subtotal?: number;
  currency?: string;
  status?: OrderStatus;
  paymentStatus?: PaymentStatus;
  paymentMethod?: "cash_on_delivery" | "card" | "bank_transfer";
  fulfillmentStatus?: FulfillmentStatus;
  shippingMethod?: {
    id?: string;
    name?: string;
    carrier?: string;
    service?: string;
    price?: number;
    minDeliveryDays?: number;
    maxDeliveryDays?: number;
  };
  campaign?: {
    name?: string;
    code?: string;
  };
  discount?: number;
  items?: Array<{
    name?: string;
    quantity?: number;
    unitPrice?: number;
    total?: number;
  }>;
  createdAt?: string;
  updatedAt?: string;
};

export type CategoryRef = {
  _id: string;
  name?: string;
  slug?: string;
};

export type Category = {
  _id: string;
  name: string;
  slug?: string;
  status?: "active" | "inactive";
  isActive?: boolean;
  parent?: string | CategoryRef | null;
  ancestors?: Array<string | CategoryRef>;
  level?: number;
  children?: Category[];
  image?: string;
  productCount?: number;
  createdAt?: string;
};

export type CategoryPayload = {
  name: string;
  image?: string;
  parent?: string | null;
};

export type LowStockItem = {
  _id?: string;
  productId?: string;
  product?: string;
  warehouse?: string;
  variantSku?: string;
  name?: string;
  sku?: string;
  stock?: number;
  reserved?: number;
  lowStockThreshold?: number;
};

export type LowStockReport = {
  products: LowStockItem[];
  variants: LowStockItem[];
  warehouses: LowStockItem[];
};

export type Warehouse = {
  _id: string;
  name: string;
  code?: string;
  address?: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type WarehousePayload = {
  name: string;
  code?: string;
  address?: string;
  isActive?: boolean;
};

export type Slider = {
  _id: string;
  title: string;
  subtitle?: string;
  image: string;
  link?: string;
  buttonText?: string;
  order?: number;
  priority?: number;
  isActive?: boolean;
  startAt?: string;
  endAt?: string;
  createdAt?: string;
};

export type SliderPayload = {
  title: string;
  subtitle?: string;
  image: string;
  link?: string;
  buttonText?: string;
  order?: number;
  priority?: number;
  isActive?: boolean;
};

export type Branding = {
  _id?: string;
  tenantId?: string;
  logoDesktop?: string;
  logoMobile?: string;
  storeName?: string;
  tagline?: string;
  announcement?: string;
  supportEmail?: string;
  supportPhone?: string;
  address?: string;
  currency?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type Brand = {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  logo?: string;
  coverImage?: string;
  website?: string;
  priority?: number;
  isFeatured?: boolean;
  isActive?: boolean;
  createdAt?: string;
};

export type BrandPayload = Omit<Brand, "_id" | "createdAt" | "slug"> & {
  slug?: string;
};

export type ShippingMethod = {
  _id: string;
  name: string;
  code: string;
  description?: string;
  carrier?: string;
  service?: string;
  countries?: string[];
  price: number;
  freeAbove?: number;
  minDeliveryDays: number;
  maxDeliveryDays: number;
  priority?: number;
  isActive?: boolean;
  createdAt?: string;
};

export type ShippingMethodPayload = Omit<ShippingMethod, "_id" | "createdAt">;

export type Collection = {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  productIds?: string[];
  categoryIds?: string[];
  tags?: string[];
  priority?: number;
  isFeatured?: boolean;
  isActive?: boolean;
  createdAt?: string;
};

export type CollectionPayload = Omit<Collection, "_id" | "createdAt">;

export type Campaign = {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  badge?: string;
  image?: string;
  code?: string;
  discountType: "percentage" | "fixed";
  discountValue: number;
  minimumSpend?: number;
  maximumDiscount?: number;
  productIds?: string[];
  categoryIds?: string[];
  tags?: string[];
  startsAt: string;
  endsAt: string;
  priority?: number;
  isFeatured?: boolean;
  isActive?: boolean;
  createdAt?: string;
};

export type CampaignPayload = Omit<Campaign, "_id" | "createdAt">;

export type ListResult<T> = {
  rows: T[];
  meta: ApiMeta;
};
