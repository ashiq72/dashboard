import { type FormEvent, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { login } from "../lib/api";
import { saveSession } from "../lib/session";
import { useAuth } from "../app/auth";
import { ErrorBanner } from "../shared/ui/feedback";
import { getErrorMessage } from "../shared/utils";

export function LoginPage() {
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

