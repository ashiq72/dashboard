import { useState } from "react";
import {
  Boxes,
  ChevronDown,
  ClipboardList,
  Image,
  LayoutDashboard,
  LogOut,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Palette,
  Settings,
  ShieldCheck,
  ShoppingBag,
  Store,
  Tags,
  Truck,
  BadgePercent,
  BadgeCheck,
  Layers3,
  X,
} from "lucide-react";
import { NavLink, Route, Routes } from "react-router-dom";
import { getTenantId } from "../lib/api";
import { useAuth } from "./auth";
import { useTenant } from "./tenant";
import { Overview } from "../features/overview/Overview";
import { ProductCreatePage, Products } from "../features/products/Products";
import { Orders } from "../features/orders/Orders";
import {
  Categories,
  CategoryCreatePage,
} from "../features/categories/Categories";
import { Inventory } from "../features/inventory/Inventory";
import {
  WarehouseCreatePage,
  Warehouses,
} from "../features/warehouses/Warehouses";
import { SliderCreatePage, Sliders } from "../features/sliders/Sliders";
import {
  BrandingEditPage,
  BrandingPage,
} from "../features/branding/BrandingPage";
import { SettingsPage } from "../features/settings/SettingsPage";
import {
  ShippingCreatePage,
  ShippingMethods,
} from "../features/shipping/ShippingMethods";
import {
  CollectionCreatePage,
  Collections,
} from "../features/collections/Collections";
import {
  CampaignCreatePage,
  Campaigns,
} from "../features/campaigns/Campaigns";
import { BrandCreatePage, Brands } from "../features/brands/Brands";

const navGroups = [
  {
    label: "Workspace",
    items: [{ to: "/", label: "Overview", icon: LayoutDashboard }],
  },
  {
    label: "Commerce",
    items: [
      { to: "/products", label: "Products", icon: ShoppingBag },
      { to: "/categories", label: "Categories", icon: Tags },
      { to: "/brands", label: "Brands", icon: BadgeCheck },
      { to: "/inventory", label: "Inventory", icon: Boxes },
      { to: "/warehouses", label: "Warehouses", icon: Truck },
      { to: "/shipping", label: "Shipping", icon: Truck },
    ],
  },
  {
    label: "Sales",
    items: [{ to: "/orders", label: "Orders", icon: ClipboardList }],
  },
  {
    label: "Storefront",
    items: [
      { to: "/sliders", label: "Sliders", icon: Image },
      { to: "/branding", label: "Branding", icon: Palette },
      { to: "/collections", label: "Collections", icon: Layers3 },
      { to: "/campaigns", label: "Campaigns", icon: BadgePercent },
    ],
  },
  {
    label: "System",
    items: [{ to: "/settings", label: "Settings", icon: Settings }],
  },
];

export function Shell() {
  const { session, setSession } = useAuth();
  const { tenant, loading: tenantLoading } = useTenant();
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const tenantId = session?.tenantId || getTenantId();
  const workspaceName =
    tenant?.subdomain || tenant?.domain?.split(".")[0] || tenantId;
  const planLabel = tenant?.plan || "basic";

  const logout = () => {
    setSession(null);
  };

  return (
    <div className={`app-shell ${collapsed ? "shell-collapsed" : ""}`}>
      <aside className={`sidebar ${open ? "sidebar-open" : ""}`}>
        <div className="sidebar-heading">
          <div className="brand">
            <div className="brand-mark">C</div>
            <div className="brand-copy">
              <strong>Commerce360</strong>
              <span>Store operations</span>
            </div>
          </div>
          <button
            className="sidebar-collapse"
            type="button"
            onClick={() => setCollapsed((value) => !value)}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <PanelLeftOpen size={17} /> : <PanelLeftClose size={17} />}
          </button>
        </div>

        <div className="store-context">
          <div className="store-icon">
            <Store size={18} />
          </div>
          <div className="store-copy">
            <span>Current store</span>
            <strong>{tenantLoading ? "Loading..." : workspaceName}</strong>
          </div>
          <span
            className={`store-live ${tenant?.status === "disabled" ? "paused" : ""}`}
          >
            {tenant?.status === "disabled" ? "Paused" : "Live"}
          </span>
        </div>

        <nav className="nav-groups" aria-label="Main navigation">
          {navGroups.map((group) => (
            <div className="nav-group" key={group.label}>
              <span className="nav-group-label">{group.label}</span>
              <div className="nav-list">
                {group.items.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.to === "/"}
                    data-label={item.label}
                    title={collapsed ? item.label : undefined}
                    onClick={() => setOpen(false)}
                    className={({ isActive }) =>
                      `nav-link ${isActive ? "active" : ""}`
                    }
                  >
                    <item.icon size={18} />
                    <span>{item.label}</span>
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-account">
            <div className="account-avatar">
              {(session?.user?.name || session?.user?.email || "A")
                .slice(0, 1)
                .toUpperCase()}
            </div>
            <div className="account-copy">
              <strong>{session?.user?.name || session?.user?.email || "Admin"}</strong>
              <span>{session?.user?.role || "Store administrator"}</span>
            </div>
            <button
              className="sidebar-account-action"
              type="button"
              aria-label="Sign out"
              title="Sign out"
              onClick={logout}
            >
              <LogOut size={16} />
            </button>
          </div>
          <div className="tenant-trust">
            <ShieldCheck size={15} />
            <span>
              {planLabel} plan{tenant?.region ? ` / ${tenant.region}` : ""}
            </span>
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
            <p className="eyebrow">{planLabel} SaaS workspace</p>
            <h1>{workspaceName}</h1>
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
            <Route path="/products/new" element={<ProductCreatePage />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/categories" element={<Categories />} />
            <Route path="/categories/new" element={<CategoryCreatePage />} />
            <Route path="/inventory" element={<Inventory />} />
            <Route path="/warehouses" element={<Warehouses />} />
            <Route path="/warehouses/new" element={<WarehouseCreatePage />} />
            <Route path="/sliders" element={<Sliders />} />
            <Route path="/sliders/new" element={<SliderCreatePage />} />
            <Route path="/branding" element={<BrandingPage />} />
            <Route path="/branding/edit" element={<BrandingEditPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/shipping" element={<ShippingMethods />} />
            <Route path="/shipping/new" element={<ShippingCreatePage />} />
            <Route path="/collections" element={<Collections />} />
            <Route path="/collections/new" element={<CollectionCreatePage />} />
            <Route path="/campaigns" element={<Campaigns />} />
            <Route path="/campaigns/new" element={<CampaignCreatePage />} />
            <Route path="/brands" element={<Brands />} />
            <Route path="/brands/new" element={<BrandCreatePage />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}
