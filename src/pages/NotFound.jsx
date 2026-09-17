import {
  AlertTriangle,
  Compass,
} from "lucide-react";
import {
  Link,
  useLocation,
} from "react-router-dom";

import { useAuth } from "../context/AuthContext";

function NotFound() {
  const location = useLocation();
  const { isAuthenticated } = useAuth();

  const hasRoleGate =
    location.pathname.startsWith("/admin") ||
    location.pathname.startsWith(
      "/access-requests",
    );

  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas p-5">
      <div className="w-full max-w-md text-center">
        <div className="mx-auto flex size-16 items-center justify-center rounded-2xl border border-primary/30 bg-primary/10">
          {hasRoleGate ? (
            <AlertTriangle
              size={30}
              className="text-amber-300"
            />
          ) : (
            <Compass
              size={30}
              className="text-primary-hover"
            />
          )}
        </div>

        <h1 className="mt-6 text-4xl font-bold text-ink">
          {hasRoleGate ? "403" : "404"}
        </h1>

        <h2 className="mt-2 text-lg font-semibold text-ink">
          {hasRoleGate
            ? "Access denied"
            : "Page not found"}
        </h2>

        <p className="mt-3 text-sm leading-6 text-ink-muted">
          {hasRoleGate
            ? "This area is restricted to administrator accounts. Your session was declined access to this route."
            : `No route matches "${location.pathname}". The link may be outdated or the page may have moved.`}
        </p>

        <div className="mt-7 flex items-center justify-center gap-3">
          <Link
            to="/dashboard"
            className="rounded-xl bg-primary px-5 py-3 text-sm font-medium text-white transition hover:bg-primary-hover"
          >
            Return to dashboard
          </Link>

          {!isAuthenticated && (
            <Link
              to="/login"
              className="rounded-xl border border-edge px-5 py-3 text-sm font-medium text-ink-secondary transition hover:border-primary/40 hover:text-ink"
            >
              Sign in
            </Link>
          )}
        </div>

        <p className="mt-6 font-mono text-xs text-ink-muted">
          path: {location.pathname}
        </p>
      </div>
    </div>
  );
}

export default NotFound;