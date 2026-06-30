import type { ApiMeta, LowStockReport, Product, ProductStatus } from "../../types";

export const money = (value?: number, currency = "USD") =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(Number(value || 0));

export const date = (value?: string) =>
  (() => {
    if (!value) return "Not set";
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return "Not set";
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(parsed);
  })();

export const stockOf = (item: { stock?: number; reserved?: number }) =>
  Number(item.stock || 0) - Number(item.reserved || 0);

export const statusLabel = (status?: string) => status || "draft";

export const activeLabel = (isActive?: boolean) => (isActive === false ? "inactive" : "active");

export const productStatus = (product: Product): ProductStatus =>
  product.status || (product.isActive ? "active" : "draft");

export const productImage = (product: Product) =>
  product.thumbnail || product.images?.find(Boolean) || "/vite.svg";

export const parseTagText = (value: string) =>
  value
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);

export const joinText = (values?: string[]) => values?.join(", ") || "";

export const numberOrUndefined = (value: string) => {
  if (value.trim() === "") return undefined;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) throw new Error("Numeric fields must contain valid numbers");
  return parsed;
};

export const attributesFromText = (value: string) => {
  const entries = value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [key, ...rest] = line.split(":");
      return [key?.trim(), rest.join(":").trim()] as const;
    })
    .filter(([key, text]) => key && text);

  return entries.length ? Object.fromEntries(entries) : undefined;
};

export const textFromAttributes = (attributes?: Record<string, string>) =>
  attributes
    ? Object.entries(attributes)
        .map(([key, value]) => key + ": " + value)
        .join("\n")
    : "";

export const lowStockItems = (report: LowStockReport) => [
  ...report.products,
  ...report.variants,
  ...report.warehouses,
];

export const getErrorMessage = (error: unknown, fallback: string) =>
  error instanceof Error ? error.message : fallback;

export const confirmAction = (message: string) => window.confirm(message);

export const totalPagesOf = (meta?: ApiMeta) => {
  const value = Number(meta?.totalPage || meta?.totalPages || 1);
  return Number.isFinite(value) && value > 0 ? value : 1;
};

