import type { LowStockItem, Order } from "../../types";
import { money, stockOf } from "../utils";
import { EmptyState, StatusPill } from "./feedback";
import { PanelTitle } from "./page";

export function MiniOrderList({
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

export function MiniStockList({
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

export function StockSection({ title, items }: { title: string; items: LowStockItem[] }) {
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

