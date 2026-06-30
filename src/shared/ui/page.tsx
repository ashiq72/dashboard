import { type ReactNode } from "react";
import { Search, type LucideIcon } from "lucide-react";
import type { ApiMeta } from "../../types";
import { totalPagesOf } from "../utils";

export function MetricCard({
  icon: Icon,
  label,
  value,
  detail,
}: {
  icon: LucideIcon;
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

export function PanelTitle({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="panel-title">
      <div>
        <h3>{title}</h3>
        <p>{detail}</p>
      </div>
    </div>
  );
}

export function Pagination({
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

export function DataPage({
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

export function SearchBox({
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

