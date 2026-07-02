import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  BadgePercent,
  Boxes,
  CircleDollarSign,
  Clock3,
  Layers3,
  PackageCheck,
  Plus,
  RefreshCw,
  ShoppingBag,
  Sparkles,
  Tags,
  Truck,
  Users,
} from "lucide-react";
import { Link } from "react-router-dom";
import { ecommerceApi } from "../../lib/api";
import type {
  Branding,
  LowStockItem,
  LowStockReport,
  Order,
  Product,
} from "../../types";
import { getErrorMessage, money, stockOf } from "../../shared/utils";
import { EmptyState, ErrorBanner, StatusPill } from "../../shared/ui/feedback";

type OverviewData = {
  products: Product[];
  orders: Order[];
  lowStock: LowStockReport;
  branding: Branding | null;
};

const emptyLowStock: LowStockReport = {
  products: [],
  variants: [],
  warehouses: [],
};

const startOfDay = (value: Date) => {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
};

const shortDate = (value?: string) => {
  if (!value) return "Just now";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Just now";
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
};

const customerName = (order: Order) =>
  order.customer?.name ||
  order.customer?.email ||
  order.customer?.phone ||
  "Guest customer";

export function Overview() {
  const [data, setData] = useState<OverviewData>({
    products: [],
    orders: [],
    lowStock: emptyLowStock,
    branding: null,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [products, orders, lowStock, branding] = await Promise.all([
        ecommerceApi.products({ limit: 100, status: "all" }),
        ecommerceApi.orders({ limit: 100 }),
        ecommerceApi.lowStock(),
        ecommerceApi.branding(),
      ]);
      setData({
        products: products.rows,
        orders: orders.rows,
        lowStock,
        branding: branding.data || null,
      });
    } catch (err) {
      setError(getErrorMessage(err, "Dashboard overview could not be loaded"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const currency =
    data.branding?.currency || data.orders[0]?.currency || "USD";
  const revenue = data.orders.reduce(
    (sum, order) =>
      order.status === "cancelled" || order.status === "refunded"
        ? sum
        : sum + Number(order.total || 0),
    0,
  );
  const activeProducts = data.products.filter(
    (product) =>
      product.status === "active" ||
      (product.status === undefined && product.isActive !== false),
  ).length;
  const openOrders = data.orders.filter((order) =>
    ["pending", "paid", "processing"].includes(order.status || "pending"),
  ).length;
  const customers = new Set(
    data.orders
      .map((order) => order.customer?.email || order.customer?.phone)
      .filter(Boolean),
  ).size;
  const inventoryAlerts = [
    ...data.lowStock.products,
    ...data.lowStock.variants,
    ...data.lowStock.warehouses,
  ];

  const week = useMemo(() => {
    const today = startOfDay(new Date());
    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date(today);
      date.setDate(today.getDate() - (6 - index));
      const next = new Date(date);
      next.setDate(date.getDate() + 1);
      const orders = data.orders.filter((order) => {
        const created = order.createdAt ? new Date(order.createdAt) : null;
        return created && created >= date && created < next;
      });
      return {
        key: date.toISOString(),
        label: date.toLocaleDateString(undefined, { weekday: "short" }),
        orders: orders.length,
        revenue: orders.reduce(
          (sum, order) =>
            order.status === "cancelled" || order.status === "refunded"
              ? sum
              : sum + Number(order.total || 0),
          0,
        ),
      };
    });
  }, [data.orders]);
  const maxDailyRevenue = Math.max(...week.map((day) => day.revenue), 1);
  const weekRevenue = week.reduce((sum, day) => sum + day.revenue, 0);
  const weekOrders = week.reduce((sum, day) => sum + day.orders, 0);

  const storeName = data.branding?.storeName || "Your store";
  const attentionItems = inventoryAlerts.slice(0, 5);

  return (
    <div className="overview-premium">
      {error ? <ErrorBanner message={error} /> : null}

      <section className="overview-welcome">
        <div>
          <p className="overview-kicker">
            <Sparkles size={14} />
            Store command center
          </p>
          <h2>
            Welcome back. <span>{storeName}</span> is ready for today.
          </h2>
          <p>
            A focused view of sales, orders, catalog health, and inventory
            across the last seven days.
          </p>
        </div>
        <div className="overview-welcome-actions">
          <span className="overview-live">
            <i />
            Store live
          </span>
          <button
            type="button"
            className="overview-icon-button"
            onClick={() => void load()}
            disabled={loading}
            title="Refresh overview"
            aria-label="Refresh overview"
          >
            <RefreshCw size={17} className={loading ? "spin" : ""} />
          </button>
          <Link to="/products/new" className="primary-button">
            <Plus size={16} />
            Add product
          </Link>
        </div>
      </section>

      <section className="overview-metrics" aria-label="Store metrics">
        <article className="overview-metric revenue">
          <span className="overview-metric-icon">
            <CircleDollarSign size={19} />
          </span>
          <div>
            <p>Gross revenue</p>
            <strong>{money(revenue, currency)}</strong>
            <small>{money(weekRevenue, currency)} in the last 7 days</small>
          </div>
        </article>
        <article className="overview-metric orders">
          <span className="overview-metric-icon">
            <ShoppingBag size={19} />
          </span>
          <div>
            <p>Open orders</p>
            <strong>{openOrders}</strong>
            <small>{weekOrders} orders received this week</small>
          </div>
        </article>
        <article className="overview-metric catalog">
          <span className="overview-metric-icon">
            <Boxes size={19} />
          </span>
          <div>
            <p>Active catalog</p>
            <strong>{activeProducts}</strong>
            <small>{data.products.length} total product records</small>
          </div>
        </article>
        <article className="overview-metric customers">
          <span className="overview-metric-icon">
            <Users size={19} />
          </span>
          <div>
            <p>Customers</p>
            <strong>{customers}</strong>
            <small>Unique customers from recent orders</small>
          </div>
        </article>
      </section>

      <section className="overview-primary-grid">
        <article className="overview-panel overview-performance">
          <header className="overview-panel-heading">
            <div>
              <p className="overview-kicker">Seven-day performance</p>
              <h3>Revenue movement</h3>
            </div>
            <div className="overview-panel-summary">
              <strong>{money(weekRevenue, currency)}</strong>
              <span>{weekOrders} orders</span>
            </div>
          </header>
          <div className="overview-chart">
            {week.map((day) => (
              <div className="overview-chart-day" key={day.key}>
                <div className="overview-chart-track">
                  <span
                    style={{
                      height: `${Math.max(
                        day.revenue ? 12 : 3,
                        (day.revenue / maxDailyRevenue) * 100,
                      )}%`,
                    }}
                    title={`${day.label}: ${money(day.revenue, currency)}`}
                  />
                </div>
                <strong>{day.label}</strong>
                <small>{day.orders}</small>
              </div>
            ))}
          </div>
          {!loading && data.orders.length === 0 ? (
            <p className="overview-chart-empty">
              Revenue activity will build here as orders arrive.
            </p>
          ) : null}
        </article>

        <aside className="overview-panel overview-actions">
          <header className="overview-panel-heading">
            <div>
              <p className="overview-kicker">Quick actions</p>
              <h3>Keep the store moving</h3>
            </div>
          </header>
          <div className="overview-action-list">
            <Link to="/orders">
              <span className="action-icon coral">
                <PackageCheck size={18} />
              </span>
              <span>
                <strong>Review orders</strong>
                <small>{openOrders} need attention</small>
              </span>
              <ArrowRight size={16} />
            </Link>
            <Link to="/inventory">
              <span className="action-icon gold">
                <Boxes size={18} />
              </span>
              <span>
                <strong>Check inventory</strong>
                <small>{inventoryAlerts.length} stock alerts</small>
              </span>
              <ArrowRight size={16} />
            </Link>
            <Link to="/campaigns/new">
              <span className="action-icon blue">
                <BadgePercent size={18} />
              </span>
              <span>
                <strong>Launch campaign</strong>
                <small>Create a scheduled offer</small>
              </span>
              <ArrowRight size={16} />
            </Link>
            <Link to="/collections/new">
              <span className="action-icon green">
                <Layers3 size={18} />
              </span>
              <span>
                <strong>Curate collection</strong>
                <small>Group products for discovery</small>
              </span>
              <ArrowRight size={16} />
            </Link>
          </div>
        </aside>
      </section>

      <section className="overview-secondary-grid">
        <article className="overview-panel overview-orders">
          <header className="overview-panel-heading">
            <div>
              <p className="overview-kicker">Latest activity</p>
              <h3>Recent orders</h3>
            </div>
            <Link to="/orders">
              View all
              <ArrowRight size={15} />
            </Link>
          </header>
          {loading ? (
            <div className="overview-loading-rows">
              <i />
              <i />
              <i />
            </div>
          ) : data.orders.length ? (
            <div className="overview-order-list">
              {data.orders.slice(0, 6).map((order) => (
                <div key={order._id}>
                  <span className="order-avatar">
                    {customerName(order).slice(0, 1).toUpperCase()}
                  </span>
                  <span className="order-copy">
                    <strong>{order.orderNumber || order._id.slice(-8)}</strong>
                    <small>
                      {customerName(order)} / {shortDate(order.createdAt)}
                    </small>
                  </span>
                  <strong className="order-total">
                    {money(order.total, order.currency || currency)}
                  </strong>
                  <StatusPill status={order.status} />
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              title="No orders yet"
              detail="New storefront orders will appear here."
            />
          )}
        </article>

        <aside className="overview-panel overview-inventory">
          <header className="overview-panel-heading">
            <div>
              <p className="overview-kicker">Inventory health</p>
              <h3>Needs attention</h3>
            </div>
            <Link to="/inventory">
              Open inventory
              <ArrowRight size={15} />
            </Link>
          </header>
          {loading ? (
            <div className="overview-loading-rows">
              <i />
              <i />
              <i />
            </div>
          ) : attentionItems.length ? (
            <div className="overview-stock-list">
              {attentionItems.map((item, index) => (
                <StockAlert
                  item={item}
                  key={
                    item._id ||
                    item.productId ||
                    `${item.sku || item.variantSku}-${index}`
                  }
                />
              ))}
            </div>
          ) : (
            <div className="overview-all-clear">
              <PackageCheck size={24} />
              <strong>Inventory looks healthy</strong>
              <span>No low-stock items need attention.</span>
            </div>
          )}
        </aside>
      </section>

      <section className="overview-store-tools">
        <Link to="/categories">
          <Tags size={17} />
          <span>
            <strong>Categories</strong>
            Organize navigation
          </span>
          <ArrowRight size={15} />
        </Link>
        <Link to="/shipping">
          <Truck size={17} />
          <span>
            <strong>Shipping</strong>
            Manage delivery methods
          </span>
          <ArrowRight size={15} />
        </Link>
        <Link to="/sliders">
          <Sparkles size={17} />
          <span>
            <strong>Storefront</strong>
            Refresh homepage media
          </span>
          <ArrowRight size={15} />
        </Link>
        <Link to="/orders">
          <Clock3 size={17} />
          <span>
            <strong>Fulfillment</strong>
            Track order progress
          </span>
          <ArrowRight size={15} />
        </Link>
      </section>
    </div>
  );
}

function StockAlert({ item }: { item: LowStockItem }) {
  const stock = stockOf(item);
  const threshold = Math.max(Number(item.lowStockThreshold || 0), 1);
  const percentage = Math.min(100, Math.max(6, (stock / threshold) * 100));
  return (
    <div>
      <span className="stock-alert-icon">
        <Boxes size={16} />
      </span>
      <span className="stock-alert-copy">
        <strong>{item.name || item.variantSku || "Stock item"}</strong>
        <small>{item.sku || item.variantSku || "No SKU"}</small>
      </span>
      <span className="stock-alert-meter">
        <i style={{ width: `${percentage}%` }} />
      </span>
      <strong className="stock-alert-count">{stock}</strong>
    </div>
  );
}

