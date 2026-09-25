import { ChevronLeft, ChevronRight } from "lucide-react";
import { NavLink } from "react-router-dom";
import {
  primaryNavigation,
  secondaryNavigation,
} from "../../config/navigation";
import netraLogo from "../../assets/netra-logo.png";
import { useI18n } from "../../i18n";

function SidebarLink({ item, collapsed }) {
  const Icon = item.icon;
  const { t } = useI18n();
  const label = t(`nav.${item.key}`);

  return (
    <NavLink
      to={item.path}
      end
      title={collapsed ? label : undefined}
      className={({ isActive }) =>
        [
          "group relative flex min-h-11 items-center rounded-xl border px-3",
          "transition-all duration-200",
          collapsed ? "justify-center" : "gap-3",
          isActive
            ? "border-primary/40 bg-gradient-to-r from-primary/20 via-primary/10 to-accent/5 text-ink shadow-glow-primary"
            : "border-transparent text-ink-secondary hover:bg-white/5 hover:text-ink",
        ].join(" ")
      }
    >
      {({ isActive }) => (
        <>
          {isActive && !collapsed && (
            <span
              className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-gradient-to-b from-primary to-accent"
              aria-hidden="true"
            />
          )}

          <Icon
            size={20}
            strokeWidth={isActive ? 2.2 : 1.9}
            className={[
              "shrink-0 transition-colors",
              isActive
                ? "text-accent"
                : "text-ink-secondary group-hover:text-ink",
            ].join(" ")}
            aria-hidden="true"
          />

          {!collapsed && (
            <span className="truncate text-sm font-medium">
              {label}
            </span>
          )}
        </>
      )}
    </NavLink>
  );
}

function SidebarSection({ items, collapsed }) {
  return (
    <div className="space-y-1">
      {items.map((item) => (
        <SidebarLink
          key={item.path}
          item={item}
          collapsed={collapsed}
        />
      ))}
    </div>
  );
}

export default function Sidebar({ collapsed, onToggle }) {
  const { t } = useI18n();

  return (
    <aside
      className={[
        "fixed inset-y-0 left-0 z-40 flex flex-col",
        "border-r border-edge bg-sidebar",
        "transition-[width] duration-300",
        collapsed ? "w-20" : "w-72",
      ].join(" ")}
    >
      <div className="border-b border-edge px-4 py-5">
        <div
          className={[
            "flex items-center",
            collapsed ? "justify-center" : "gap-3",
          ].join(" ")}
        >
          <div className="flex h-11 shrink-0 items-center px-0.5">
            <img
              src={netraLogo}
              alt="NETRA"
              className="h-9 w-auto object-contain"
              draggable="false"
            />
          </div>

          {!collapsed && (
            <div className="min-w-0">
              <h1 className="truncate text-lg font-bold tracking-widest">
                NETRA
              </h1>

              <p className="truncate text-xs text-ink-secondary">
                {t("brand.tagline")}
              </p>
            </div>
          )}
        </div>

        {!collapsed && (
          <div className="mt-4 rounded-lg border border-edge bg-surface px-3 py-2 text-center">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-secondary">
              {t("brand.sublabel")}
            </p>
          </div>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto p-3">
        <SidebarSection
          items={primaryNavigation}
          collapsed={collapsed}
        />

        <div className="my-4 border-t border-edge" />

        <SidebarSection
          items={secondaryNavigation}
          collapsed={collapsed}
        />
      </nav>

      <div className="border-t border-edge p-3">
        <button
          type="button"
          onClick={onToggle}
          className={[
            "flex min-h-11 w-full items-center rounded-xl px-3",
            "text-ink-secondary transition hover:bg-white/5 hover:text-ink",
            collapsed ? "justify-center" : "gap-3",
          ].join(" ")}
          aria-label={collapsed ? t("sidebar.expand") : t("sidebar.collapse")}
        >
          {collapsed ? (
            <ChevronRight size={20} />
          ) : (
            <>
              <ChevronLeft size={20} />

              <span className="text-sm font-medium">
                {t("sidebar.collapse")}
              </span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}