import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ShoppingBag, Tags, TriangleAlert, Truck } from "lucide-react";
import { ecommerceApi } from "../../lib/api";
import type { LowStockReport } from "../../types";
import { getErrorMessage, lowStockItems } from "../../shared/utils";
import { EmptyState, ErrorBanner } from "../../shared/ui/feedback";
import { DataPage, MetricCard } from "../../shared/ui/page";
import { StockSection } from "../../shared/ui/lists";

export function Inventory() {
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

