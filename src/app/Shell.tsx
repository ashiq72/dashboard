import { useState } from "react";
import {
  Boxes,
  ChevronDown,
  ClipboardList,
  Image,
  LayoutDashboard,
  LogOut,
  Menu,
  Palette,
  Settings,
  ShieldCheck,
  ShoppingBag,
  Tags,
  Truck,
  X,
} from "lucide-react";
import { NavLink, Route, Routes } from "react-router-dom";
import { getTenantId } from "../lib/api";
import { useAuth } from "./auth";
import { Overview } from "../features/overview/Overview";
import { Products } from "../features/products/Products";
import { Orders } from "../features/orders/Orders";
import { Categories } from "../features/categories/Categories";
import { Inventory } from "../features/inventory/Inventory";
import { Warehouses } from "../features/warehouses/Warehouses";
import { Sliders } from "../features/sliders/Sliders";
import { BrandingPage } from "../features/branding/BrandingPage";
import { SettingsPage } from "../features/settings/SettingsPage";

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

export function Shell() {
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

