import { type FormEvent, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../app/auth-context";
import { login } from "../lib/api";
import { saveSession } from "../lib/session";
import { getErrorMessage } from "../shared/utils";
import {
  ArrowDownLeft,
  ArrowRight,
  ArrowUpRight,
  Check,
  ChevronDown,
  Eye,
  EyeOff,
  Leaf,
  LockKeyhole,
  Mail,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
} from "lucide-react";
import "../login-premium.css";

function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`tl-brand ${compact ? "tl-brand-mobile" : ""}`}>
      <span className="tl-brand-symbol">
        <ShoppingBag size={21} strokeWidth={1.6} />
        <span />
      </span>
      <div>
        <strong>
          Commerce<span>360</span>
        </strong>
        <small>অ্যাডমিন ওয়ার্কস্পেস</small>
      </div>
    </div>
  );
}

function AnalyticsPreview() {
  return (
    <div
      className="tl-scene"
      aria-label="দোকানের নমুনা হিসাব: মোট আয় ২,৪৫,০৯০ টাকা, অর্ডার ১,২৮৪টি, প্রবৃদ্ধি ১৮.৬ শতাংশ"
    >
      <div className="tl-orbit tl-orbit-one" />
      <div className="tl-orbit tl-orbit-two" />
      <svg
        className="tl-geometry"
        viewBox="0 0 260 260"
        fill="none"
        aria-hidden="true"
      >
        <defs>
          <linearGradient
            id="tl-cube-top"
            x1="55"
            y1="45"
            x2="215"
            y2="135"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#FACC15" stopOpacity=".65" />
            <stop offset="1" stopColor="#F4C542" stopOpacity=".08" />
          </linearGradient>
          <linearGradient
            id="tl-cube-side"
            x1="90"
            y1="90"
            x2="145"
            y2="235"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#F4C542" stopOpacity=".35" />
            <stop offset="1" stopColor="#6B5525" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path
          d="M130 26 220 78 130 130 40 78Z"
          fill="url(#tl-cube-top)"
          stroke="#FFE7A3"
          strokeOpacity=".25"
        />
        <path
          d="M40 78 130 130 130 234 40 182Z"
          fill="url(#tl-cube-side)"
          stroke="#F7D77B"
          strokeOpacity=".15"
        />
        <path
          d="M130 130 220 78 220 182 130 234Z"
          fill="#F4C542"
          fillOpacity=".07"
          stroke="#F7D77B"
          strokeOpacity=".15"
        />
        <path
          d="M85 52 175 104M85 104 175 52M85 104V208M175 104V208"
          stroke="#FFE7A3"
          strokeOpacity=".13"
        />
      </svg>
      <div className="tl-analytics">
        <div className="tl-card-header">
          <span>
            <span className="tl-dot" />
            দোকানের সারসংক্ষেপ
          </span>
          <span className="tl-period">
            এই মাসে <ChevronDown size={11} />
          </span>
        </div>
        <div className="tl-revenue">
          <span>মোট আয়</span>
          <div>
            <strong>
              ৳২,৪৫,০৯০<span>.০০</span>
            </strong>
            <span className="tl-growth">
              <ArrowUpRight size={12} />
              +১৮.৬%
            </span>
          </div>
          <small>দারুণ চলছে! এগিয়ে যাচ্ছে আপনার ব্যবসা।</small>
        </div>
        <div className="tl-chart" aria-hidden="true">
          <svg viewBox="0 0 440 140" fill="none" preserveAspectRatio="none">
            <defs>
              <linearGradient id="tl-chart-fill" x1="0" y1="0" x2="0" y2="1">
                <stop stopColor="#F4C542" stopOpacity=".23" />
                <stop offset="1" stopColor="#F4C542" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path
              d="M0 30H440M0 75H440M0 120H440"
              stroke="#fff"
              strokeOpacity=".055"
              strokeDasharray="3 5"
            />
            <path
              className="tl-chart-area"
              d="M0 119C16 119 20 103 38 107S61 117 80 95S104 103 122 84S144 95 164 70S186 82 208 65S230 75 251 51S276 65 297 40S319 46 341 28S364 38 387 17S413 27 440 7V140H0Z"
              fill="url(#tl-chart-fill)"
            />
            <path
              className="tl-sales-line"
              pathLength={1}
              d="M0 119C16 119 20 103 38 107S61 117 80 95S104 103 122 84S144 95 164 70S186 82 208 65S230 75 251 51S276 65 297 40S319 46 341 28S364 38 387 17S413 27 440 7"
              stroke="#F4C542"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            <circle
              className="tl-chart-endpoint"
              cx="440"
              cy="7"
              r="3"
              fill="#F4C542"
            />
          </svg>
          <div>
            <span>জুন ০১</span>
            <span>জুন ১০</span>
            <span>জুন ২০</span>
            <span>জুন ৩০</span>
          </div>
        </div>
        <div className="tl-card-bottom">
          <div>
            <span>মোট অর্ডার</span>
            <strong>
              ১,২৮৪ <small>+১২.৮%</small>
            </strong>
          </div>
          <div>
            <span>কনভার্সন রেট</span>
            <strong>
              ৩.৬২% <small>+২.৪%</small>
            </strong>
          </div>
          <span className="tl-chart-icon">
            <ArrowUpRight size={22} />
          </span>
        </div>
      </div>
      <div className="tl-order">
        <span className="tl-order-icon">
          <Check size={16} />
        </span>
        <div>
          <strong>নতুন একটি অর্ডার এসেছে</strong>
          <span>অর্ডার #১০২৮ · এইমাত্র</span>
        </div>
        <b>+৳১২৯.০০</b>
      </div>
    </div>
  );
}

export function LoginPage() {
  const { session, setSession } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [visible, setVisible] = useState(false);
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (session) return <Navigate to="/" replace />;

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (loading) return;
    setError("");
    setNotice("");
    setLoading(true);
    try {
      const response = await login(email, password);
      const next = saveSession(
        response.data.accessToken,
        response.data.tenantId,
      );
      setSession(next);
      navigate("/", { replace: true });
    } catch (err) {
      setError(getErrorMessage(err, "লগইন করা যায়নি। আবার চেষ্টা করুন।"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="tl-login" lang="bn">
      <section
        className="tl-story"
        aria-label="Commerce360 ওয়ার্কস্পেস পরিচিতি"
      >
        <div className="tl-ambient" aria-hidden="true" />
        <Brand />
        <div className="tl-story-content">
          <div className="tl-tag">
            <span />
            সহজ পরিচালনা। অসীম সম্ভাবনা।
          </div>
          <h1>
            আপনার ব্যবসার
            <br />
            সব প্রয়োজন।
            <br />
            <em>এক জায়গায়।</em>
          </h1>
          <p>
            দোকানের নিয়ন্ত্রণ রাখুন নিজের হাতে। বিক্রির হিসাব দেখুন, আর
            আত্মবিশ্বাসের সঙ্গে এগিয়ে নিন আপনার ব্যবসা।
          </p>
          <AnalyticsPreview />
        </div>
        <div className="tl-story-footer">
          <span>
            <span className="tl-live-dot" />
            আপনার ব্যবসার নতুন অধ্যায়ের সঙ্গী।
          </span>
          <span>
            কম ঝামেলা। বেশি অগ্রগতি। <ArrowUpRight size={13} />
          </span>
        </div>
      </section>
      <section className="tl-form-side" aria-labelledby="tl-heading">
        <div className="tl-top-note">
          <ShieldCheck size={14} />
          আপনার ব্যবসা, নির্ভরতার সঙ্গে।
        </div>
        <Brand compact />
        <div className="tl-form-wrap">
          <div className="tl-welcome-icon">
            <ArrowDownLeft size={24} strokeWidth={1.5} />
            <span>
              <Sparkles size={10} />
            </span>
          </div>
          <div className="tl-form-heading">
            <h2 id="tl-heading">
              আবারও স্বাগতম<span>।</span>
            </h2>
            <p>আপনার ওয়ার্কস্পেসে যেতে লগইন করুন।</p>
          </div>
          <form onSubmit={submit} className="tl-form">
            <div className="tl-field">
              <label htmlFor="tl-email">ইমেইল অথবা ফোন নম্বর</label>
              <div className="tl-input-wrap">
                <Mail size={17} />
                <input
                  id="tl-email"
                  name="email"
                  type="text"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="ইমেইল অথবা 01XXXXXXXXX"
                  autoComplete="username"
                  autoCapitalize="none"
                  spellCheck={false}
                  required
                />
              </div>
            </div>
            <div className="tl-field">
              <label htmlFor="tl-password">পাসওয়ার্ড</label>
              <div className="tl-input-wrap">
                <LockKeyhole size={17} />
                <input
                  id="tl-password"
                  name="password"
                  type={visible ? "text" : "password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="আপনার পাসওয়ার্ড লিখুন"
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  className="tl-eye"
                  onClick={() => setVisible(!visible)}
                  aria-label={visible ? "পাসওয়ার্ড লুকান" : "পাসওয়ার্ড দেখুন"}
                  aria-pressed={visible}
                >
                  {visible ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>
            <div className="tl-form-options">
              <button
                className="tl-text-button"
                type="button"
                onClick={() =>
                  setNotice(
                    "পাসওয়ার্ড পুনরুদ্ধারের জন্য আপনার প্ল্যাটফর্ম অ্যাডমিনের সঙ্গে যোগাযোগ করুন।",
                  )
                }
              >
                পাসওয়ার্ড ভুলে গেছেন?
              </button>
            </div>
            {error && (
              <div className="tl-login-error" role="alert">
                {error}
              </div>
            )}
            <button
              type="submit"
              className="tl-submit"
              disabled={loading}
              aria-busy={loading}
            >
              {loading ? "লগইন হচ্ছে…" : "লগইন করুন"} <ArrowRight size={17} />
            </button>
            {notice && (
              <div className="tl-notice" role="status">
                {notice}
              </div>
            )}
          </form>
          <p className="tl-security">
            <ShieldCheck size={14} />
            আপনার ওয়ার্কস্পেসে নিরাপদ প্রবেশাধিকার।
          </p>
        </div>
        <footer className="tl-form-footer">
          <span>
            ©{" "}
            {new Date()
              .getFullYear()
              .toLocaleString("bn-BD", { useGrouping: false })}{" "}
            Commerce360
          </span>
          <span>
            <Leaf size={12} />
            ব্যবসা এগিয়ে নেওয়ার সঙ্গী।
          </span>
        </footer>
      </section>
    </main>
  );
}
