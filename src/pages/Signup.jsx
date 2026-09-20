import {
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { useState } from "react";
import {
  Link,
  Navigate,
  useNavigate,
} from "react-router-dom";

import netraLogo from "../assets/netra-logo.png";
import { useAuth } from "../context/AuthContext";
import { useI18n } from "../i18n";

const DEMO_ACCOUNTS_KEY = "NETRA-signup-accounts";

function Signup() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const { t } = useI18n();

  const [fullName, setFullName] = useState("");
  const [employeeId, setEmployeeId] =
    useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] =
    useState("Investigator");
  const [district, setDistrict] =
    useState("Bengaluru Urban");
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

  function handleSubmit(event) {
    event.preventDefault();

    setLoading(true);
    setError("");

    try {
      if (
        !fullName.trim() ||
        !email.trim() ||
        !password.trim()
      ) {
        throw new Error(
          "Name, email and password are required.",
        );
      }

      if (password.length < 8) {
        throw new Error(
          "Password must be at least 8 characters.",
        );
      }

      const account = {
        id: `KP-${role === "Administrator" ? "ADMIN" : "INV"}-${String(
          Math.floor(1000 + Math.random() * 9000),
        )}`,
        name: fullName.trim(),
        employeeId: employeeId.trim() || null,
        email: email.trim().toLowerCase(),
        role,
        district,
        status: "Pending approval",
        registeredAt: new Date().toISOString(),
      };

      const existing = JSON.parse(
        localStorage.getItem(DEMO_ACCOUNTS_KEY) ||
          "[]",
      );

      localStorage.setItem(
        DEMO_ACCOUNTS_KEY,
        JSON.stringify([
          ...existing,
          account,
        ]),
      );

      navigate(
        `/login?registered=1&role=${encodeURIComponent(
          role,
        )}`,
        { replace: true },
      );
    } catch (signupError) {
      setError(
        signupError?.message ||
          "Unable to create the account.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas p-5">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-3xl border border-edge bg-surface shadow-2xl lg:grid-cols-2">
        <section className="hidden min-h-[680px] flex-col justify-between bg-gradient-to-br from-primary/25 via-surface to-canvas p-10 lg:flex">
          <div>
            <div className="flex h-14 w-fit shrink-0 items-center justify-center rounded-2xl border border-primary/30 bg-primary/10 px-2">
              <img
                src={netraLogo}
                alt="NETRA"
                className="h-10 w-auto object-contain"
                draggable="false"
              />
            </div>

            <h1 className="mt-6 text-3xl font-bold text-ink">
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
              {t("auth.signupTitle")}
            </h2>

            <p className="mt-4 max-w-md text-sm leading-7 text-ink-secondary">
              A new account is created in "Pending approval"
              status and becomes active after an
              administrator verifies the officer record.
            </p>
          </div>
        </section>

        <section className="flex min-h-[680px] items-center p-7 sm:p-10">
          <div className="mx-auto w-full max-w-md">
            <div className="lg:hidden">
              <div className="flex h-12 w-fit items-center justify-center rounded-xl bg-primary/10 px-1.5">
                <img
                  src={netraLogo}
                  alt="NETRA"
                  className="h-9 w-auto object-contain"
                  draggable="false"
                />
              </div>
            </div>

            <h2 className="mt-5 text-3xl font-bold text-ink">
              Create account
            </h2>

            <p className="mt-2 text-sm text-ink-secondary">
              Register as an investigator or administrator
              for NETRA AI.
            </p>

            {error && (
              <div className="mt-5 rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-red-300">
                {error}
              </div>
            )}

            <form
              onSubmit={handleSubmit}
              className="mt-7 space-y-5"
            >
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-300">
                  Full name
                </span>

                <div className="relative">
                  <UserRound
                    size={18}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-muted"
                  />

                  <input
                    type="text"
                    value={fullName}
                    onChange={(event) =>
                      setFullName(event.target.value)
                    }
                    autoComplete="name"
                    required
                    className="w-full rounded-xl border border-edge bg-surface py-3 pl-11 pr-4 text-sm text-ink outline-none placeholder:text-ink-muted focus:border-primary"
                    placeholder="Officer full name"
                  />
                </div>
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-300">
                  Employee / unit ID
                </span>

                <div className="relative">
                  <ShieldCheck
                    size={18}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-muted"
                  />

                  <input
                    type="text"
                    value={employeeId}
                    onChange={(event) =>
                      setEmployeeId(event.target.value)
                    }
                    className="w-full rounded-xl border border-edge bg-surface py-3 pl-11 pr-4 font-mono text-sm text-ink outline-none placeholder:text-ink-muted focus:border-primary"
                    placeholder="e.g. KP-INV-318"
                  />
                </div>
              </label>

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
                    className="w-full rounded-xl border border-edge bg-surface py-3 pl-11 pr-4 text-sm text-ink outline-none placeholder:text-ink-muted focus:border-primary"
                    placeholder="Officer email"
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
                    autoComplete="new-password"
                    required
                    className="w-full rounded-xl border border-edge bg-surface py-3 pl-11 pr-12 text-sm text-ink outline-none placeholder:text-ink-muted focus:border-primary"
                    placeholder="Minimum 8 characters"
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

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-slate-300">
                    Role
                  </span>

                  <select
                    value={role}
                    onChange={(event) =>
                      setRole(event.target.value)
                    }
                    className="w-full rounded-xl border border-edge bg-surface px-4 py-3 text-sm text-ink outline-none focus:border-primary"
                  >
                    <option>
                      Investigator
                    </option>
                    <option>
                      Administrator
                    </option>
                  </select>
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-slate-300">
                    District
                  </span>

                  <select
                    value={district}
                    onChange={(event) =>
                      setDistrict(event.target.value)
                    }
                    className="w-full rounded-xl border border-edge bg-surface px-4 py-3 text-sm text-ink outline-none focus:border-primary"
                  >
                    {[
                      "Bengaluru Urban",
                      "Bengaluru Rural",
                      "Mysuru",
                      "Mangaluru",
                      "Hubballi-Dharwad",
                      "Belagavi",
                      "Kalaburagi",
                      "Shivamogga",
                      "All Districts",
                    ].map((option) => (
                      <option
                        key={option}
                        value={option}
                      >
                        {option}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-primary px-4 py-3 font-semibold text-white transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading
                  ? "Creating account..."
                  : "Create account"}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-ink-muted">
              Already registered?{" "}
              <Link
                to="/login?registered=0"
                className="font-semibold text-primary-hover transition hover:text-primary"
              >
                Sign in
              </Link>
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}

export default Signup;