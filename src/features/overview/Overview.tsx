import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Boxes, ClipboardList, Image, ShieldCheck, ShoppingBag } from "lucide-react";
import { ecommerceApi } from "../../lib/api";
import { useAuth } from "../../app/auth";
import type { Category, LowStockReport, Order, Product } from "../../types";
import { getErrorMessage, lowStockItems, money } from "../../shared/utils";
import { ErrorBanner } from "../../shared/ui/feedback";
import { PanelTitle } from "../../shared/ui/page";
import { MiniOrderList, MiniStockList } from "../../shared/ui/lists";

export function Overview() {
  const { session } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [lowStock, setLowStock] = useState<LowStockReport>({
    products: [],
    variants: [],
    warehouses: [],
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    Promise.allSettled([
      ecommerceApi.products({ limit: 100 }),
      ecommerceApi.orders({ limit: 100 }),
      ecommerceApi.categories({ limit: 100 }),
      ecommerceApi.lowStock(),
    ])
      .then(([productRes, orderRes, categoryRes, lowStockRes]) => {
        if (!active) return;
        if (productRes.status === "fulfilled") setProducts(productRes.value.rows);
        if (orderRes.status === "fulfilled") setOrders(orderRes.value.rows);
        if (categoryRes.status === "fulfilled")
          setCategories(categoryRes.value.rows);
        if (lowStockRes.status === "fulfilled")
          setLowStock(lowStockRes.value);
        const rejected = [productRes, orderRes, categoryRes, lowStockRes].find(
          (item) => item.status === "rejected",
        );
        setError(
          rejected?.status === "rejected"
            ? rejected.reason instanceof Error
              ? rejected.reason.message
              : "Some dashboard data could not load"
            : "",
        );
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const revenue = orders.reduce((sum, order) => sum + Number(order.total || 0), 0);
  const activeProducts = products.filter(
    (product) => product.status === "active" || product.isActive,
  ).length;
  const pendingOrders = orders.filter(
    (order) => order.status === "pending" || order.status === "processing",
  ).length;
  const stockAlerts = lowStockItems(lowStock);
  const deliveredOrders = orders.filter((order) => order.status === "delivered").length;
  const cancelledOrders = orders.filter((order) => order.status === "cancelled").length;
  const returnedOrders = orders.filter((order) => order.status === "refunded").length;
  const paidOrders = orders.filter((order) => order.paymentStatus === "paid").length;
  const processingOrders = orders.filter((order) => order.status === "processing").length;
  const adminName = session?.user?.name || session?.user?.email?.split("@")[0] || "ash";
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - 6);
  const rangeText = `${new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(weekStart)} - ${new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(now)}`;

  return (
    <div className="home-page">
      {error && <ErrorBanner message={error} />}
      <section className="home-hero">
        <div className="home-hero-copy">
          <p className="eyebrow">{adminName}</p>
          <h2>Welcome back, {adminName}. Here is your 7-day performance snapshot.</h2>
          <p>Your dashboard is ready. Use the tabs below to monitor performance at a glance.</p>
          <div className="setup-row">
            <span>Setup</span>
            <strong>100% complete - 0 steps left</strong>
          </div>
          <div className="setup-progress">
            <span />
          </div>
        </div>
        <div className="date-range-card">
          <span>Select date range</span>
          <strong>{rangeText}</strong>
        </div>
      </section>

      <section className="home-action-grid">
        <Link to="/orders">
          <span>View orders</span>
          <ClipboardList size={18} />
        </Link>
        <Link to="/products">
          <span>Product catalog</span>
          <ShoppingBag size={18} />
        </Link>
        <Link to="/sliders">
          <span>Marketing</span>
          <Image size={18} />
        </Link>
        <Link to="/inventory">
          <span>Live inventory</span>
          <Boxes size={18} />
        </Link>
      </section>

      <section className="home-board">
        <div className="home-board-main">
          <div className="home-tabs">
            <button className="active" type="button">Overview</button>
            <button type="button">Subscription</button>
          </div>
          <div className="home-kpi-grid">
            <HomeKpi label="Transaction" value={money(revenue)} trend={orders.length ? "live" : "0.00%"} />
            <HomeKpi label="Net sale" value={money(revenue)} trend="0.00%" />
            <HomeKpi label="Profit" value={money(revenue * 0.28)} trend="0.00%" />
            <HomeKpi label="Total orders" value={String(orders.length)} trend="0.00%" />
            <HomeKpi label="Pending" value={String(pendingOrders)} trend="0.00%" />
            <HomeKpi label="Paid" value={String(paidOrders)} trend="0.00%" />
            <HomeKpi label="Processing" value={String(processingOrders)} trend="0.00%" />
            <HomeKpi label="Delivered" value={String(deliveredOrders)} trend="0.00%" />
            <HomeKpi label="Cancel" value={String(cancelledOrders)} trend="0.00%" />
            <HomeKpi label="Returned" value={String(returnedOrders)} trend="0.00%" />
            <HomeKpi label="Total products" value={String(products.length)} trend={`${activeProducts} active`} />
            <HomeKpi label="Low stock" value={String(stockAlerts.length)} trend={`${categories.length} categories`} negative={stockAlerts.length > 0} />
          </div>
        </div>
        <aside className="live-panel">
          <div className="live-panel-head">
            <div>
              <span className="live-dot" />
              <h3>Live analytics</h3>
            </div>
            <Link to="/orders">View details</Link>
          </div>
          <div className="live-metrics">
            <div>
              <ShieldCheck size={22} />
              <span>Live</span>
              <strong>{loading ? "..." : "0"}</strong>
            </div>
            <div>
              <UsersIcon />
              <span>Total today</span>
              <strong>{orders.length}</strong>
            </div>
          </div>
          <PanelTitle title="Recent orders" detail="Newest admin order feed" />
          <MiniOrderList orders={orders.slice(0, 4)} loading={loading} />
          <PanelTitle title="Inventory watch" detail="Products needing attention" />
          <MiniStockList items={stockAlerts.slice(0, 4)} loading={loading} />
        </aside>
      </section>
    </div>
  );
}

function UsersIcon() {
  return (
    <span className="users-icon">
      <ShieldCheck size={20} />
    </span>
  );
}

function HomeKpi({
  label,
  value,
  trend,
  negative = false,
}: {
  label: string;
  value: string;
  trend: string;
  negative?: boolean;
}) {
  return (
    <article className="home-kpi-card">
      <span>{label}</span>
      <strong>{value}</strong>
      <p className={negative ? "negative" : ""}>
        <span />
        {trend} <small>vs last period</small>
      </p>
    </article>
  );
}

