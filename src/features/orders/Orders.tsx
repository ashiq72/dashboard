import { useCallback, useEffect, useState } from "react";
import { ecommerceApi } from "../../lib/api";
import type { ApiMeta, Order, OrderStatus } from "../../types";
import { useDebouncedValue } from "../../shared/hooks/useDebouncedValue";
import { date, getErrorMessage, money } from "../../shared/utils";
import { EmptyState, ErrorBanner, StatusPill } from "../../shared/ui/feedback";
import { DataPage, Pagination, SearchBox } from "../../shared/ui/page";

export function Orders() {
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

