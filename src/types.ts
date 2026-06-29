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

export type ProductStatus = "draft" | "active" | "archived";
export type ProductListStatus = ProductStatus | "inactive" | "all";

export type Product = {
  _id: string;
  name: string;
  slug?: string;
  sku?: string;
  brand?: string;
  price: number;
  salePrice?: number;
  currency?: string;
  stock?: number;
  reserved?: number;
  lowStockThreshold?: number;
  trackStock?: boolean;
  status?: ProductStatus;
  isActive?: boolean;
  scope?: "tenant" | "global";
  thumbnail?: string;
  images?: string[];
  categories?: unknown[];
  createdAt?: string;
  updatedAt?: string;
};

export type ProductPayload = {
  name: string;
  sku?: string;
  brand?: string;
  price: number;
  salePrice?: number;
  currency?: string;
  stock?: number;
  lowStockThreshold?: number;
  thumbnail?: string;
  status?: ProductStatus;
  trackStock?: boolean;
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
  fulfillmentStatus?: FulfillmentStatus;
  items?: Array<{
    name?: string;
    quantity?: number;
    unitPrice?: number;
    total?: number;
  }>;
  createdAt?: string;
  updatedAt?: string;
};

export type Category = {
  _id: string;
  name: string;
  slug?: string;
  status?: "active" | "inactive";
  isActive?: boolean;
  parent?: string | null;
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
  createdAt?: string;
  updatedAt?: string;
};

export type ListResult<T> = {
  rows: T[];
  meta: ApiMeta;
};
