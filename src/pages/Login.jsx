import {
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
} from "lucide-react";

import { useState } from "react";
import {
  Link,
  Navigate,
  useLocation,
  useNavigate,
} from "react-router-dom";

import netraLogo from "../assets/netra-logo.png";
import { useAuth } from "../context/AuthContext";
import { useI18n } from "../i18n";

function Login() {
  const navigate = useNavigate();
  const location = useLocation();

  const { login, isAuthenticated } = useAuth();

  const { t } = useI18n();

  const registrationParams = new URLSearchParams(
    location.search,
  );

  const justRegistered =
    registrationParams.get("registered") === "1";

  const requestedRole =
    registrationParams.get("role") ||
    "Investigator";

  const [email, setEmail] = useState(
    "analyst@NETRA.ai",
  );

  const [password, setPassword] = useState(
    "NETRA@123",
  );

  const [showPassword, setShowPassword] =
    useState(false);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] = useState("");

  if (isAuthenticated) {
    return (
      <Navigate
        to="/dashboard"
        replace
      />
    );
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setLoading(true);
    setError("");

    try {
      login({
        email,
        password,
      });

      const destination =
        location.state?.from ||
        "/dashboard";

      navigate(destination, {
        replace: true,
      });
    } catch (loginError) {
      setError(
        loginError?.message ||
          "Login failed.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas p-5">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-3xl border border-edge bg-surface shadow-2xl lg:grid-cols-2">
        <section className="hidden min-h-[620px] flex-col justify-between bg-gradient-to-br from-primary/25 via-canvas to-background p-10 lg:flex">
          <div>
            <div className="flex h-14 w-fit shrink-0 items-center">
              <img
                src={netraLogo}
                alt="NETRA"
                className="h-12 w-auto object-contain"
                draggable="false"
              />
            </div>

            <h1 className="mt-6 text-3xl font-bold tracking-tight text-ink">
              NETRA AI
            </h1>

            <p className="mt-3 text-ink-secondary">
              {t("auth.platformLabel")}
            </p>
          </div>

          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary-hover">
              {t("auth.platformLabel")}
            </p>

            <h2 className="mt-4 max-w-md text-3xl font-bold leading-tight text-ink">
              {t("auth.loginTitle")}
            </h2>

            <p className="mt-4 max-w-md text-sm leading-7 text-ink-secondary">
              {t("auth.loginSubtitle")}
            </p>
          </div>
        </section>

        <section className="flex min-h-[620px] items-center p-7 sm:p-10">
          <div className="mx-auto w-full max-w-md">
            <div className="lg:hidden">
              <div className="flex h-12 w-fit items-center">
                <img
                  src={netraLogo}
                  alt="NETRA"
                  className="h-11 w-auto object-contain"
                  draggable="false"
                />
              </div>
            </div>

            <h2 className="mt-5 text-3xl font-bold tracking-tight text-ink">
              {t("auth.signInHeading")}
            </h2>

            <p className="mt-2 text-sm text-ink-secondary">
              {t("auth.signInDescription")}
            </p>

            {error && (
              <div className="mt-5 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                {error}
              </div>
            )}

            {justRegistered && (
              <div className="mt-5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
                Account created as {requestedRole}. Pending
                approval by an administrator — use the
                demonstration credentials below to explore
                the platform meanwhile.
              </div>
            )}

            <form
              onSubmit={handleSubmit}
              className="mt-7 space-y-5"
            >
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-300">
                  Email address
                </span>

                <div className="relative">
                  <Mail
                    size={18}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-muted"
                  />

                  <input
                    type="email"
                    value={email}
                    onChange={(event) =>
                      setEmail(event.target.value)
                    }
                    autoComplete="email"
                    required
                    className="w-full rounded-xl border border-edge bg-canvas/70 py-3 pl-11 pr-4 text-sm text-ink outline-none placeholder:text-ink-muted focus:border-primary"
                    placeholder="Enter your email"
                  />
                </div>
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-300">
                  Password
                </span>

                <div className="relative">
                  <LockKeyhole
                    size={18}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-muted"
                  />

                  <input
                    type={
                      showPassword
                        ? "text"
                        : "password"
                    }
                    value={password}
                    onChange={(event) =>
                      setPassword(event.target.value)
                    }
                    autoComplete="current-password"
                    required
                    className="w-full rounded-xl border border-edge bg-canvas/70 py-3 pl-11 pr-12 text-sm text-ink outline-none placeholder:text-ink-muted focus:border-primary"
                    placeholder="Enter your password"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowPassword(
                        (current) => !current,
                      )
                    }
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-ink-muted hover:text-ink"
                    aria-label={
                      showPassword
                        ? "Hide password"
                        : "Show password"
                    }
                  >
                    {showPassword ? (
                      <EyeOff size={18} />
                    ) : (
                      <Eye size={18} />
                    )}
                  </button>
                </div>
              </label>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-primary px-4 py-3 font-semibold text-white transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading
                  ? "Signing in..."
                  : "Sign in"}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-ink-muted">
              Need an account?{" "}
              <Link
                to="/signup"
                className="font-semibold text-primary-hover transition hover:text-primary"
              >
                Create account
              </Link>
            </p>

            <div className="mt-6 rounded-xl border border-primary/20 bg-primary/5 p-4">
              <p className="text-xs font-semibold text-primary-hover">
                Demonstration credentials
              </p>

              <p className="mt-2 text-xs text-ink-secondary">
                Email: analyst@NETRA.ai
              </p>

              <p className="mt-1 text-xs text-ink-secondary">
                Password: NETRA@123
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export default Login;