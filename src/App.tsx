import {
  Boxes,
  ChevronDown,
  CircleDollarSign,
  ClipboardList,
  Image,
  LayoutDashboard,
  LogOut,
  Menu,
  PackageCheck,
  Palette,
  Plus,
  RefreshCw,
  Save,
  Search,
  Settings,
  ShieldCheck,
  ShoppingBag,
  Tags,
  TriangleAlert,
  Trash2,
  Truck,
  X,
} from "lucide-react";
import {
  Component,
  createContext,
  type ErrorInfo,
  FormEvent,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import {
  Link,
  Navigate,
  NavLink,
  Route,
  Routes,
  useNavigate,
} from "react-router-dom";
import { ecommerceApi, getTenantId, healthCheck, login } from "./lib/api";
import { clearSession, getStoredSession, saveSession } from "./lib/session";
import type {
  ApiMeta,
  AuthSession,
  Category,
  LowStockItem,
  LowStockReport,
  Order,
  OrderStatus,
  Product,
  ProductListStatus,
  ProductStatus,
  Slider,
  Warehouse,
} from "./types";

type AuthContextValue = {
  session: AuthSession | null;
  setSession: (session: AuthSession | null) => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const useAuth = () => {
  const value = useContext(AuthContext);
  if (!value) throw new Error("Auth context missing");
  return value;
};

const money = (value?: number, currency = "USD") =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(Number(value || 0));

const date = (value?: string) =>
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

const stockOf = (item: { stock?: number; reserved?: number }) =>
  Number(item.stock || 0) - Number(item.reserved || 0);

const statusLabel = (status?: string) => status || "draft";

const activeLabel = (isActive?: boolean) => (isActive === false ? "inactive" : "active");

const lowStockItems = (report: LowStockReport) => [
  ...report.products,
  ...report.variants,
  ...report.warehouses,
];

const getErrorMessage = (error: unknown, fallback: string) =>
  error instanceof Error ? error.message : fallback;

const confirmAction = (message: string) =>
  window.confirm(message);

const totalPagesOf = (meta?: ApiMeta) => {
  const value = Number(meta?.totalPage || meta?.totalPages || 1);
  return Number.isFinite(value) && value > 0 ? value : 1;
};

function useDebouncedValue<T>(value: T, delay = 300) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const id = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(id);
  }, [value, delay]);

  return debounced;
}

const StatusPill = ({ status }: { status?: string }) => (
  <span className={`status-pill status-${statusLabel(status)}`}>
    {statusLabel(status)}
  </span>
);

const EmptyState = ({
  title,
  detail,
}: {
  title: string;
  detail: string;
}) => (
  <div className="empty-state">
    <PackageCheck size={34} />
    <h3>{title}</h3>
    <p>{detail}</p>
  </div>
);

const ErrorBanner = ({ message }: { message: string }) => (
  <div className="error-banner">
    <TriangleAlert size={18} />
    <span>{message}</span>
  </div>
);

class AppErrorBoundary extends Component<
  { children: ReactNode },
  { error: Error | null }
> {
  state: { error: Error | null } = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Dashboard render failed", error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="fatal-page">
          <div className="auth-card">
            <ErrorBanner message={this.state.error.message || "The dashboard hit an unexpected error"} />
            <button
              className="primary-button"
              type="button"
              onClick={() => this.setState({ error: null })}
            >
              Try again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSessionState] = useState<AuthSession | null>(() =>
    getStoredSession(),
  );

  useEffect(() => {
    const refreshSession = () => setSessionState(getStoredSession());
    const expireSession = () => setSessionState(null);

    window.addEventListener("storage", refreshSession);
    window.addEventListener("commerce360:session-expired", expireSession);

    return () => {
      window.removeEventListener("storage", refreshSession);
      window.removeEventListener("commerce360:session-expired", expireSession);
    };
  }, []);

  const setSession = (next: AuthSession | null) => {
    if (!next) clearSession();
    setSessionState(next);
  };

  return (
    <AuthContext.Provider value={{ session, setSession }}>
      {children}
    </AuthContext.Provider>
  );
}

function RequireAuth({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  if (!session) return <Navigate to="/login" replace />;
  return children;
}

const navItems = [
  { to: "/", label: "Overview", icon: LayoutDashboard },
  { to: "/products", label: "Products", icon: ShoppingBag },
  { to: "/orders", label: "Orders", icon: ClipboardList },
  { to: "/categories", label: "Categories", icon: Tags },
  { to: "/inventory", label: "Inventory", icon: Boxes },
  { to: "/warehouses", label: "Warehouses", icon: Truck },
  { to: "/sliders", label: "Sliders", icon: Image },
  { to: "/branding", label: "Branding", icon: Palette },
  { to: "/settings", label: "Settings", icon: Settings },
];

function Shell() {
  const { session, setSession } = useAuth();
  const [open, setOpen] = useState(false);

  const logout = () => {
    setSession(null);
  };

  return (
    <div className="app-shell">
      <aside className={`sidebar ${open ? "sidebar-open" : ""}`}>
        <div className="brand">
          <div className="brand-mark">C</div>
          <div>
            <strong>Commerce360</strong>
            <span>Admin dashboard</span>
          </div>
        </div>

        <nav className="nav-list">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `nav-link ${isActive ? "active" : ""}`
              }
            >
              <item.icon size={18} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="tenant-card">
          <ShieldCheck size={18} />
          <div>
            <span>Tenant</span>
            <strong>{session?.tenantId || getTenantId()}</strong>
          </div>
        </div>
      </aside>

      <div className="main-area">
        <header className="topbar">
          <button
            className="icon-button mobile-only"
            type="button"
            onClick={() => setOpen((value) => !value)}
            aria-label="Toggle navigation"
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
          <div>
            <p className="eyebrow">E-commerce operations</p>
            <h1>Store command center</h1>
          </div>
          <div className="topbar-actions">
            <div className="user-chip">
              <span>{session?.user?.name || session?.user?.email || "Admin"}</span>
              <ChevronDown size={16} />
            </div>
            <button className="ghost-button" type="button" onClick={logout}>
              <LogOut size={16} />
              Logout
            </button>
          </div>
        </header>
        <main className="content">
          <Routes>
            <Route index element={<Overview />} />
            <Route path="/products" element={<Products />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/categories" element={<Categories />} />
            <Route path="/inventory" element={<Inventory />} />
            <Route path="/warehouses" element={<Warehouses />} />
            <Route path="/sliders" element={<Sliders />} />
            <Route path="/branding" element={<BrandingPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

function LoginPage() {
  const { session, setSession } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (session) return <Navigate to="/" replace />;

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const response = await login(email, password);
      const next = saveSession(response.data.accessToken, response.data.tenantId);
      setSession(next);
      navigate("/", { replace: true });
    } catch (err) {
      setError(getErrorMessage(err, "Login failed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <section className="login-visual">
        <Link to="/" className="brand large">
          <div className="brand-mark">C</div>
          <div>
            <strong>Commerce360</strong>
            <span>Built for Base360 stores</span>
          </div>
        </Link>
        <div className="login-copy">
          <p className="eyebrow">Premium store control</p>
          <h1>Manage products, orders, and inventory from one calm place.</h1>
          <p>
            A focused admin dashboard for tenant-based e-commerce operations.
          </p>
        </div>
        <div className="login-metrics">
          <div>
            <strong>Realtime</strong>
            <span>Inventory posture</span>
          </div>
          <div>
            <strong>Tenant safe</strong>
            <span>x-tenant-id ready</span>
          </div>
        </div>
      </section>

      <section className="login-panel">
        <form className="auth-card" onSubmit={submit}>
          <p className="eyebrow">Sign in</p>
          <h2>Welcome back</h2>
          <p className="form-note">
            Use your Base360 admin email and password.
          </p>
          {error && <ErrorBanner message={error} />}
          <label>
            Email
            <input
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              type="email"
              placeholder="admin@example.com"
              required
            />
          </label>
          <label>
            Password
            <input
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              type="password"
              placeholder="Your password"
              required
            />
          </label>
          <button className="primary-button" type="submit" disabled={loading}>
            {loading ? "Signing in..." : "Sign in"}
          </button>
          <p className="form-note">
            API: {import.meta.env.VITE_API_URL || "http://localhost:4000/api/v1"}
          </p>
        </form>
      </section>
    </div>
  );
}

function Overview() {
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

  return (
    <div className="page-stack">
      {error && <ErrorBanner message={error} />}
      <section className="hero-panel">
        <div>
          <p className="eyebrow">Today at a glance</p>
          <h2>Keep the store moving without noise.</h2>
          <p>
            Track catalog health, order flow, low-stock risk, and category
            coverage from one operational view.
          </p>
        </div>
        <div className="hero-actions">
          <Link className="primary-button" to="/products">
            <ShoppingBag size={16} />
            Manage products
          </Link>
          <Link className="ghost-button" to="/orders">
            <ClipboardList size={16} />
            View orders
          </Link>
        </div>
      </section>

      <section className="metric-grid">
        <MetricCard
          icon={CircleDollarSign}
          label="Revenue"
          value={money(revenue)}
          detail={`${orders.length} tracked orders`}
        />
        <MetricCard
          icon={ShoppingBag}
          label="Active products"
          value={String(activeProducts)}
          detail={`${products.length} total products`}
        />
        <MetricCard
          icon={ClipboardList}
          label="Open orders"
          value={String(pendingOrders)}
          detail="Pending or processing"
        />
        <MetricCard
          icon={TriangleAlert}
          label="Low stock"
          value={String(stockAlerts.length)}
          detail={`${categories.length} categories live`}
        />
      </section>

      <section className="split-grid">
        <div className="panel">
          <PanelTitle title="Recent orders" detail="Newest admin order feed" />
          <MiniOrderList orders={orders.slice(0, 6)} loading={loading} />
        </div>
        <div className="panel">
          <PanelTitle title="Inventory watch" detail="Products needing attention" />
          <MiniStockList items={stockAlerts.slice(0, 6)} loading={loading} />
        </div>
      </section>
    </div>
  );
}

function Products() {
  const [rows, setRows] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<ProductListStatus>("all");
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState<ApiMeta>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const debouncedSearch = useDebouncedValue(search);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await ecommerceApi.products({
        search: debouncedSearch,
        status,
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
  }, [debouncedSearch, page, status]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, status]);

  const updateStatus = async (id: string, next: ProductStatus) => {
    setError("");
    try {
      await ecommerceApi.updateProductStatus(id, next);
      await load();
    } catch (err) {
      setError(getErrorMessage(err, "Product status could not be updated"));
    }
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
        </div>
      }
    >
      {error && <ErrorBanner message={error} />}
      <ProductCreateForm onCreated={load} />
      <div className="table-card">
        <table>
          <thead>
            <tr>
              <th>Product</th>
              <th>SKU</th>
              <th>Price</th>
              <th>Stock</th>
              <th>Status</th>
              <th>Updated</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((product) => (
              <tr key={product._id}>
                <td>
                  <div className="product-cell">
                    <img
                      src={product.thumbnail || product.images?.[0] || "/vite.svg"}
                      alt=""
                    />
                    <div>
                      <strong>{product.name}</strong>
                      <span>{product.brand || "No brand"}</span>
                    </div>
                  </div>
                </td>
                <td>{product.sku || "N/A"}</td>
                <td>{money(product.salePrice || product.price)}</td>
                <td>{stockOf(product)}</td>
                <td>
                  <select
                    className="inline-select"
                    value={statusLabel(product.status) as ProductStatus}
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

function Orders() {
  const [rows, setRows] = useState<Order[]>([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<OrderStatus | "">("");
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState<ApiMeta>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const debouncedSearch = useDebouncedValue(search);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await ecommerceApi.orders({
        search: debouncedSearch,
        status,
        page,
        limit: 20,
      });
      setRows(response.rows);
      setMeta(response.meta);
    } catch (err) {
      setError(getErrorMessage(err, "Orders failed to load"));
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

  const updateStatus = async (id: string, next: OrderStatus) => {
    setError("");
    try {
      await ecommerceApi.updateOrderStatus(id, { status: next });
      await load();
    } catch (err) {
      setError(getErrorMessage(err, "Order status could not be updated"));
    }
  };

  return (
    <DataPage
      title="Orders"
      detail="Customer orders, fulfillment state, and revenue"
      actions={
        <div className="filters">
          <SearchBox value={search} onChange={setSearch} placeholder="Search orders" />
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value as OrderStatus | "")}
          >
            <option value="">All status</option>
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
            <option value="shipped">Shipped</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      }
    >
      {error && <ErrorBanner message={error} />}
      <div className="table-card">
        <table>
          <thead>
            <tr>
              <th>Order</th>
              <th>Customer</th>
              <th>Total</th>
              <th>Payment</th>
              <th>Fulfillment</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((order) => (
              <tr key={order._id}>
                <td>
                  <strong>{order.orderNumber || order._id.slice(-8)}</strong>
                  <span className="muted-block">{date(order.createdAt)}</span>
                </td>
                <td>
                  <strong>{order.customer?.name || "Guest customer"}</strong>
                  <span className="muted-block">
                    {order.customer?.email || order.customer?.phone || "No contact"}
                  </span>
                </td>
                <td>{money(order.total, order.currency || "USD")}</td>
                <td>
                  <StatusPill status={order.paymentStatus} />
                </td>
                <td>
                  <StatusPill status={order.fulfillmentStatus} />
                </td>
                <td>
                  <select
                    className="inline-select"
                    value={order.status || "pending"}
                    onChange={(event) =>
                      void updateStatus(order._id, event.target.value as OrderStatus)
                    }
                  >
                    <option value="pending">Pending</option>
                    <option value="paid">Paid</option>
                    <option value="processing">Processing</option>
                    <option value="shipped">Shipped</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancelled</option>
                    <option value="refunded">Refunded</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!loading && rows.length === 0 && (
          <EmptyState
            title="No orders found"
            detail="New customer orders will appear here."
          />
        )}
        {loading && <p className="table-note">Loading orders...</p>}
      </div>
      <Pagination meta={meta} page={page} loading={loading} onPageChange={setPage} />
    </DataPage>
  );
}

function Categories() {
  const [rows, setRows] = useState<Category[]>([]);
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
      const response = await ecommerceApi.categories({
        search: debouncedSearch,
        status,
        page,
        limit: 20,
      });
      setRows(response.rows);
      setMeta(response.meta);
    } catch (err) {
      setError(getErrorMessage(err, "Categories failed to load"));
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

  return (
    <DataPage
      title="Categories"
      detail="Organize product discovery and merchandising"
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
        </div>
      }
    >
      {error && <ErrorBanner message={error} />}
      <CategoryCreateForm onCreated={load} />
      <div className="category-grid">
        {rows.map((category) => (
          <article className="category-card" key={category._id}>
            <div className="category-image">
              {category.image ? <img src={category.image} alt="" /> : <Tags />}
            </div>
            <div>
              <h3>{category.name}</h3>
              <p>{category.slug || "No slug"}</p>
            </div>
            <StatusPill status={category.status || activeLabel(category.isActive)} />
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

function Inventory() {
  const [report, setReport] = useState<LowStockReport>({
    products: [],
    variants: [],
    warehouses: [],
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    ecommerceApi
      .lowStock()
      .then((response) => setReport(response))
      .catch((err) =>
        setError(getErrorMessage(err, "Inventory failed to load")),
      )
      .finally(() => setLoading(false));
  }, []);

  const alerts = lowStockItems(report);

  return (
    <DataPage
      title="Inventory"
      detail="Low-stock risk and fulfillment readiness"
      actions={<Link className="ghost-button" to="/products">Open catalog</Link>}
    >
      {error && <ErrorBanner message={error} />}
      <section className="metric-grid compact">
        <MetricCard
          icon={ShoppingBag}
          label="Products"
          value={String(report.products.length)}
          detail="Base product alerts"
        />
        <MetricCard
          icon={Tags}
          label="Variants"
          value={String(report.variants.length)}
          detail="SKU level alerts"
        />
        <MetricCard
          icon={Truck}
          label="Warehouses"
          value={String(report.warehouses.length)}
          detail="Location stock alerts"
        />
        <MetricCard
          icon={TriangleAlert}
          label="Total alerts"
          value={String(alerts.length)}
          detail="Needs attention"
        />
      </section>
      <div className="inventory-sections">
        <StockSection title="Products" items={report.products} />
        <StockSection title="Variants" items={report.variants} />
        <StockSection title="Warehouses" items={report.warehouses} />
      </div>
      {!loading && alerts.length === 0 && (
        <EmptyState
          title="Inventory looks healthy"
          detail="No low-stock products were returned by the backend."
        />
      )}
      {loading && <p className="table-note">Loading inventory...</p>}
    </DataPage>
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

function CategoryCreateForm({ onCreated }: { onCreated: () => Promise<void> }) {
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      await ecommerceApi.createCategory({
        name,
      });
      setName("");
      await onCreated();
    } catch (err) {
      setError(getErrorMessage(err, "Category could not be created"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="panel admin-form-panel">
      <PanelTitle title="Add category" detail="Create a merchandising group" />
      {error && <ErrorBanner message={error} />}
      <form className="admin-form compact-form" onSubmit={submit}>
        <label>
          Name
          <input value={name} onChange={(event) => setName(event.target.value)} required />
        </label>
        <button className="primary-button form-submit" type="submit" disabled={saving}>
          <Plus size={16} />
          {saving ? "Creating..." : "Create category"}
        </button>
      </form>
    </section>
  );
}

function Warehouses() {
  const [rows, setRows] = useState<Warehouse[]>([]);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await ecommerceApi.warehouses();
      setRows(response.rows);
    } catch (err) {
      setError(getErrorMessage(err, "Warehouses failed to load"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      await ecommerceApi.createWarehouse({
        name,
        code: code || undefined,
        address: address || undefined,
        isActive: true,
      });
      setName("");
      setCode("");
      setAddress("");
      await load();
    } catch (err) {
      setError(getErrorMessage(err, "Warehouse could not be created"));
    } finally {
      setSaving(false);
    }
  };

  const toggle = async (warehouse: Warehouse) => {
    setError("");
    try {
      await ecommerceApi.updateWarehouse(warehouse._id, {
        isActive: warehouse.isActive === false,
      });
      await load();
    } catch (err) {
      setError(getErrorMessage(err, "Warehouse status could not be updated"));
    }
  };

  const remove = async (id: string) => {
    if (!confirmAction("Delete this warehouse?")) return;
    setError("");
    try {
      await ecommerceApi.deleteWarehouse(id);
      await load();
    } catch (err) {
      setError(getErrorMessage(err, "Warehouse could not be deleted"));
    }
  };

  return (
    <DataPage
      title="Warehouses"
      detail="Stock locations used by product inventory"
      actions={
        <button className="ghost-button" type="button" onClick={() => void load()}>
          <RefreshCw size={16} />
          Refresh
        </button>
      }
    >
      {error && <ErrorBanner message={error} />}
      <section className="panel admin-form-panel">
        <PanelTitle title="Add warehouse" detail="Create a fulfillment location" />
        <form className="admin-form compact-form" onSubmit={submit}>
          <label>
            Name
            <input value={name} onChange={(event) => setName(event.target.value)} required />
          </label>
          <label>
            Code
            <input value={code} onChange={(event) => setCode(event.target.value)} />
          </label>
          <label className="form-wide">
            Address
            <input value={address} onChange={(event) => setAddress(event.target.value)} />
          </label>
          <button className="primary-button form-submit" type="submit" disabled={saving}>
            <Plus size={16} />
            {saving ? "Creating..." : "Create warehouse"}
          </button>
        </form>
      </section>
      <div className="table-card">
        <table>
          <thead>
            <tr>
              <th>Warehouse</th>
              <th>Code</th>
              <th>Address</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((warehouse) => (
              <tr key={warehouse._id}>
                <td>
                  <strong>{warehouse.name}</strong>
                  <span className="muted-block">{date(warehouse.createdAt)}</span>
                </td>
                <td>{warehouse.code || "N/A"}</td>
                <td>{warehouse.address || "Not set"}</td>
                <td>
                  <StatusPill status={activeLabel(warehouse.isActive)} />
                </td>
                <td>
                  <div className="row-actions">
                    <button
                      className="ghost-button small"
                      type="button"
                      onClick={() => void toggle(warehouse)}
                    >
                      {warehouse.isActive === false ? "Activate" : "Disable"}
                    </button>
                    <button
                      className="icon-button danger"
                      type="button"
                      onClick={() => void remove(warehouse._id)}
                      aria-label="Delete warehouse"
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
            title="No warehouses found"
            detail="Create a warehouse to start assigning stock locations."
          />
        )}
        {loading && <p className="table-note">Loading warehouses...</p>}
      </div>
    </DataPage>
  );
}

function Sliders() {
  const [rows, setRows] = useState<Slider[]>([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"all" | "active" | "inactive">("all");
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState<ApiMeta>({});
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [image, setImage] = useState("");
  const [link, setLink] = useState("");
  const [buttonText, setButtonText] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
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

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      await ecommerceApi.createSlider({
        title,
        subtitle: subtitle || undefined,
        image,
        link: link || undefined,
        buttonText: buttonText || undefined,
        isActive: true,
      });
      setTitle("");
      setSubtitle("");
      setImage("");
      setLink("");
      setButtonText("");
      await load();
    } catch (err) {
      setError(getErrorMessage(err, "Slider could not be created"));
    } finally {
      setSaving(false);
    }
  };

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
        </div>
      }
    >
      {error && <ErrorBanner message={error} />}
      <section className="panel admin-form-panel">
        <PanelTitle title="Add slider" detail="Create a storefront promotion" />
        <form className="admin-form" onSubmit={submit}>
          <label>
            Title
            <input value={title} onChange={(event) => setTitle(event.target.value)} required />
          </label>
          <label>
            Button
            <input value={buttonText} onChange={(event) => setButtonText(event.target.value)} />
          </label>
          <label className="form-wide">
            Image URL
            <input
              value={image}
              onChange={(event) => setImage(event.target.value)}
              type="url"
              placeholder="https://..."
              required
            />
          </label>
          <label className="form-wide">
            Subtitle
            <input value={subtitle} onChange={(event) => setSubtitle(event.target.value)} />
          </label>
          <label className="form-wide">
            Link
            <input value={link} onChange={(event) => setLink(event.target.value)} />
          </label>
          <button className="primary-button form-submit" type="submit" disabled={saving}>
            <Plus size={16} />
            {saving ? "Creating..." : "Create slider"}
          </button>
        </form>
      </section>
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

function BrandingPage() {
  const [desktop, setDesktop] = useState("");
  const [mobile, setMobile] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await ecommerceApi.branding();
      setDesktop(response.data?.logoDesktop || "");
      setMobile(response.data?.logoMobile || "");
    } catch (err) {
      setError(getErrorMessage(err, "Branding failed to load"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const response = await ecommerceApi.updateBranding({
        logoDesktop: desktop,
        logoMobile: mobile,
      });
      setDesktop(response.data?.logoDesktop || desktop);
      setMobile(response.data?.logoMobile || mobile);
    } catch (err) {
      setError(getErrorMessage(err, "Branding could not be saved"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <DataPage
      title="Branding"
      detail="Store logo assets served by Base360"
      actions={
        <button className="ghost-button" type="button" onClick={() => void load()}>
          <RefreshCw size={16} />
          Refresh
        </button>
      }
    >
      {error && <ErrorBanner message={error} />}
      <div className="settings-grid">
        <section className="panel admin-form-panel">
          <PanelTitle title="Logo URLs" detail="Save desktop and mobile marks" />
          <form className="admin-form single-column" onSubmit={submit}>
            <label>
              Desktop logo URL
              <input
                value={desktop}
                onChange={(event) => setDesktop(event.target.value)}
                type="url"
                placeholder="https://..."
              />
            </label>
            <label>
              Mobile logo URL
              <input
                value={mobile}
                onChange={(event) => setMobile(event.target.value)}
                type="url"
                placeholder="https://..."
              />
            </label>
            <button className="primary-button form-submit" type="submit" disabled={saving}>
              <Save size={16} />
              {saving ? "Saving..." : "Save branding"}
            </button>
          </form>
          {loading && <p className="table-note">Loading branding...</p>}
        </section>
        <section className="panel">
          <PanelTitle title="Preview" detail="Current storefront assets" />
          <div className="brand-preview">
            <div>
              <span>Desktop</span>
              {desktop ? <img src={desktop} alt="" /> : <strong>No desktop logo</strong>}
            </div>
            <div>
              <span>Mobile</span>
              {mobile ? <img src={mobile} alt="" /> : <strong>No mobile logo</strong>}
            </div>
          </div>
        </section>
      </div>
    </DataPage>
  );
}

function HealthCheckPanel() {
  const [checking, setChecking] = useState(false);
  const [message, setMessage] = useState("Not checked yet");
  const [healthy, setHealthy] = useState<boolean | null>(null);

  const check = async () => {
    setChecking(true);
    setHealthy(null);
    try {
      const response = await healthCheck();
      setHealthy(true);
      setMessage(
        response.data?.timestamp
          ? `Online at ${date(response.data.timestamp)}`
          : "Base360 API is online",
      );
    } catch (err) {
      setHealthy(false);
      setMessage(getErrorMessage(err, "Base360 API is not reachable"));
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="panel">
      <PanelTitle title="API health" detail="Connectivity check" />
      <div className="health-row">
        <StatusPill status={healthy === null ? "pending" : healthy ? "active" : "failed"} />
        <span>{message}</span>
      </div>
      <button className="ghost-button" type="button" onClick={() => void check()} disabled={checking}>
        <RefreshCw size={16} />
        {checking ? "Checking..." : "Check API"}
      </button>
    </div>
  );
}

function SettingsPage() {
  const { session } = useAuth();

  return (
    <DataPage
      title="Settings"
      detail="Connection and tenant configuration"
      actions={null}
    >
      <div className="settings-grid">
        <div className="panel">
          <PanelTitle title="API connection" detail="Base360 backend target" />
          <dl className="details-list">
            <div>
              <dt>API URL</dt>
              <dd>{import.meta.env.VITE_API_URL || "http://localhost:4000/api/v1"}</dd>
            </div>
            <div>
              <dt>Tenant header</dt>
              <dd>{session?.tenantId || getTenantId()}</dd>
            </div>
            <div>
              <dt>Auth mode</dt>
              <dd>Bearer token + x-tenant-id</dd>
            </div>
            <div>
              <dt>Session</dt>
              <dd>{session?.user?.role || "Authenticated"}</dd>
            </div>
          </dl>
        </div>
        <HealthCheckPanel />
        <div className="panel">
          <PanelTitle title="Recommended backend modules" detail="Already detected in base360" />
          <div className="module-list">
            {["Products", "Orders", "Categories", "Warehouses", "Branding", "Sliders"].map(
              (module) => (
                <span key={module}>{module}</span>
              ),
            )}
          </div>
        </div>
      </div>
    </DataPage>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  detail,
}: {
  icon: typeof LayoutDashboard;
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <article className="metric-card">
      <Icon size={20} />
      <span>{label}</span>
      <strong>{value}</strong>
      <p>{detail}</p>
    </article>
  );
}

function PanelTitle({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="panel-title">
      <div>
        <h3>{title}</h3>
        <p>{detail}</p>
      </div>
    </div>
  );
}

function MiniOrderList({
  orders,
  loading,
}: {
  orders: Order[];
  loading: boolean;
}) {
  if (loading) return <p className="table-note">Loading orders...</p>;
  if (!orders.length) {
    return <EmptyState title="No recent orders" detail="Orders will land here." />;
  }
  return (
    <div className="mini-list">
      {orders.map((order) => (
        <div className="mini-row" key={order._id}>
          <div>
            <strong>{order.orderNumber || order._id.slice(-8)}</strong>
            <span>{order.customer?.name || "Guest customer"}</span>
          </div>
          <div className="mini-right">
            <strong>{money(order.total, order.currency || "USD")}</strong>
            <StatusPill status={order.status} />
          </div>
        </div>
      ))}
    </div>
  );
}

function MiniStockList({
  items,
  loading,
}: {
  items: LowStockItem[];
  loading: boolean;
}) {
  if (loading) return <p className="table-note">Loading inventory...</p>;
  if (!items.length) {
    return <EmptyState title="No low stock" detail="Inventory is steady." />;
  }
  return (
    <div className="mini-list">
      {items.map((item, index) => (
        <div className="mini-row" key={item._id || item.productId || `${item.sku}-${index}`}>
          <div>
            <strong>{item.name || item.variantSku || "Stock item"}</strong>
            <span>{item.sku || item.variantSku || "No SKU"}</span>
          </div>
          <div className="mini-right">
            <strong>{stockOf(item)}</strong>
            <span>left</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function StockSection({ title, items }: { title: string; items: LowStockItem[] }) {
  return (
    <section className="panel">
      <PanelTitle title={title} detail={`${items.length} alerts`} />
      <div className="inventory-list">
        {items.map((item, index) => {
          const available = stockOf(item);
          const threshold = Number(item.lowStockThreshold || 0);
          const meterMax = Math.max(threshold * 2, available, 1);
          return (
            <article
              className="inventory-item"
              key={item._id || item.productId || `${title}-${index}`}
            >
              <div>
                <strong>{item.name || item.variantSku || "Stock item"}</strong>
                <span>{item.sku || item.variantSku || "No SKU"}</span>
              </div>
              <div className="stock-meter">
                <span
                  style={{
                    width: `${Math.min(100, Math.max(8, (available / meterMax) * 100))}%`,
                  }}
                />
              </div>
              <div className="stock-count">
                <strong>{available}</strong>
                <span>threshold {threshold}</span>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function Pagination({
  meta,
  page,
  loading,
  onPageChange,
}: {
  meta: ApiMeta;
  page: number;
  loading: boolean;
  onPageChange: (page: number) => void;
}) {
  const totalPages = totalPagesOf(meta);
  const totalValue = Number(meta.total || 0);
  const total = Number.isFinite(totalValue) ? totalValue : 0;

  if (totalPages <= 1 && !total) return null;

  return (
    <div className="pagination">
      <span>
        Page {page} of {totalPages}
        {total ? ` - ${total} total` : ""}
      </span>
      <div className="row-actions">
        <button
          className="ghost-button small"
          type="button"
          disabled={loading || page <= 1}
          onClick={() => onPageChange(Math.max(1, page - 1))}
        >
          Previous
        </button>
        <button
          className="ghost-button small"
          type="button"
          disabled={loading || page >= totalPages}
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
        >
          Next
        </button>
      </div>
    </div>
  );
}

function DataPage({
  title,
  detail,
  actions,
  children,
}: {
  title: string;
  detail: string;
  actions: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="page-stack">
      <section className="page-header">
        <div>
          <p className="eyebrow">Commerce360</p>
          <h2>{title}</h2>
          <p>{detail}</p>
        </div>
        {actions}
      </section>
      {children}
    </div>
  );
}

function SearchBox({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <label className="search-box">
      <Search size={16} />
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
      />
    </label>
  );
}

function App() {
  return (
    <AppErrorBoundary>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/*"
            element={
              <RequireAuth>
                <Shell />
              </RequireAuth>
            }
          />
        </Routes>
      </AuthProvider>
    </AppErrorBoundary>
  );
}

export default App;
