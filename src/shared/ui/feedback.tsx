import { Component, type ErrorInfo, type ReactNode } from "react";
import { PackageCheck, TriangleAlert } from "lucide-react";
import { statusLabel } from "../utils";

export const StatusPill = ({ status }: { status?: string }) => (
  <span className={`status-pill status-${statusLabel(status)}`}>
    {statusLabel(status)}
  </span>
);

export const EmptyState = ({
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

export const ErrorBanner = ({ message }: { message: string }) => (
  <div className="error-banner">
    <TriangleAlert size={18} />
    <span>{message}</span>
  </div>
);

export class AppErrorBoundary extends Component<
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

