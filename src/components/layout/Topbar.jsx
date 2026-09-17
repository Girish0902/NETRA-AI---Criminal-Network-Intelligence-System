import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  Bell,
  CalendarDays,
  Check,
  ChevronDown,
  Languages,
  LogOut,
  Menu,
  Search,
  Settings,
  UserRound,
} from "lucide-react";

import { useNavigate } from "react-router-dom";
import { api } from "../../services/api";
import { useAuth } from "../../context/AuthContext";

const dateOptions = [
  {
    label: "Last 7 days",
    value: "Last 7 days",
  },
  {
    label: "Last 30 days",
    value: "Last 30 days",
  },
  {
    label: "Last 3 months",
    value: "Last 3 months",
  },
  {
    label: "Last 6 months",
    value: "Last 6 months",
  },
  {
    label: "Last 12 months",
    value: "Last 12 months",
  },
  {
    label: "All time",
    value: "All time",
  },
];

const languageOptions = [
  {
    label: "English",
    value: "English",
  },
  {
    label: "à²•à²¨à³à²¨à²¡",
    value: "à²•à²¨à³à²¨à²¡",
  },
  {
    label: "English + à²•à²¨à³à²¨à²¡",
    value: "English + à²•à²¨à³à²¨à²¡",
  },
];

const ALERT_STORAGE_KEY =
  "NETRA-acknowledged-alerts";

const ALERT_EVENT_NAME =
  "NETRA-alert-status-updated";

const DEFAULT_SETTINGS = {
  language: "English + à²•à²¨à³à²¨à²¡",
  dateRange: "Last 30 days",
  compactInterface: false,
  notificationsEnabled: true,
  criticalAlertsEnabled: true,
  refreshInterval: "Every 5 minutes",
  auditLoggingEnabled: true,
  sessionTimeout: "30 minutes",
  defaultDistrictId: "All",
  defaultDistrictName: "All Districts",
  defaultStatusId: "All",
  defaultStatusName: "All statuses",
};

function loadAppSettings() {
  try {
    const savedSettings = JSON.parse(
      localStorage.getItem("NETRA-settings") || "{}",
    );

    return {
      ...DEFAULT_SETTINGS,
      ...savedSettings,
    };
  } catch {
    return {
      ...DEFAULT_SETTINGS,
    };
  }
}

function loadAcknowledgedAlertIds() {
  try {
    const saved = JSON.parse(
      localStorage.getItem(ALERT_STORAGE_KEY) || "[]",
    );

    return Array.isArray(saved)
      ? saved.map(String)
      : [];
  } catch {
    return [];
  }
}

export default function Topbar({
  sidebarCollapsed,
  onOpenMobileSidebar,
}) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const topbarRef = useRef(null);

  const [searchText, setSearchText] = useState("");
  const [openMenu, setOpenMenu] = useState(null);

  const [appSettings, setAppSettings] =
    useState(loadAppSettings);

  const [notifications, setNotifications] =
    useState([]);

  const [
    notificationsLoading,
    setNotificationsLoading,
  ] = useState(true);

  const dateRange =
    appSettings.dateRange ||
    DEFAULT_SETTINGS.dateRange;

  const language =
    appSettings.language ||
    DEFAULT_SETTINGS.language;

  const selectedDateLabel =
    dateOptions.find(
      (option) => option.value === dateRange,
    )?.label || DEFAULT_SETTINGS.dateRange;

  const selectedLanguageLabel =
    languageOptions.find(
      (option) => option.value === language,
    )?.label || DEFAULT_SETTINGS.language;

  const unreadCount = notifications.filter(
    (notification) => notification.unread,
  ).length;

  const loadNotifications = useCallback(async () => {
    setNotificationsLoading(true);

    try {
      const response = await api.alerts();

      const source =
        response?.alerts ??
        response?.data?.alerts ??
        response?.data ??
        response ??
        [];

      const acknowledgedIds =
        loadAcknowledgedAlertIds();

      const normalizedNotifications =
        Array.isArray(source)
          ? source.map((alert, index) => {
              const id = String(
                alert.id ??
                  alert.alertId ??
                  alert.AlertID ??
                  `alert-${index}`,
              );

              return {
                id,

                title:
                  alert.title ??
                  alert.alertTitle ??
                  alert.name ??
                  "Dataset intelligence alert",

                description:
                  alert.description ??
                  alert.message ??
                  alert.details ??
                  "No additional details are available.",

                severity: normalizeSeverity(
                  alert.severity ??
                    alert.priority ??
                    alert.level ??
                    alert.type,
                ),

                district:
                  alert.districtName ??
                  alert.district ??
                  alert.location ??
                  "",

                caseCount: toNumber(
                  alert.caseCount ??
                    alert.count ??
                    alert.totalCases,
                ),

                type:
                  alert.type ??
                  alert.category ??
                  "intelligence",

                unread:
                  !acknowledgedIds.includes(id),
              };
            })
          : [];

      normalizedNotifications.sort(
        (first, second) =>
          severityRank(second.severity) -
          severityRank(first.severity),
      );

      setNotifications(
        normalizedNotifications.slice(0, 5),
      );
    } catch (error) {
      console.error(
        "Unable to load Topbar alerts:",
        error,
      );

      setNotifications([]);
    } finally {
      setNotificationsLoading(false);
    }
  }, []);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (
        topbarRef.current &&
        !topbarRef.current.contains(event.target)
      ) {
        setOpenMenu(null);
      }
    };

    document.addEventListener(
      "mousedown",
      handleOutsideClick,
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleOutsideClick,
      );
    };
  }, []);

  useEffect(() => {
    const handleSettingsUpdate = (event) => {
      const updatedSettings = {
        ...DEFAULT_SETTINGS,
        ...(event.detail || {}),
      };

      setAppSettings(updatedSettings);
    };

    const handleStorageUpdate = (event) => {
      if (
        event.key &&
        event.key !== "NETRA-settings"
      ) {
        return;
      }

      setAppSettings(loadAppSettings());
    };

    window.addEventListener(
      "NETRA-settings-updated",
      handleSettingsUpdate,
    );

    window.addEventListener(
      "storage",
      handleStorageUpdate,
    );

    return () => {
      window.removeEventListener(
        "NETRA-settings-updated",
        handleSettingsUpdate,
      );

      window.removeEventListener(
        "storage",
        handleStorageUpdate,
      );
    };
  }, []);

  useEffect(() => {
    loadNotifications();

    const handleAlertUpdate = () => {
      loadNotifications();
    };

    const handleAlertStorageUpdate = (event) => {
      if (
        event.key &&
        event.key !== ALERT_STORAGE_KEY
      ) {
        return;
      }

      loadNotifications();
    };

    window.addEventListener(
      ALERT_EVENT_NAME,
      handleAlertUpdate,
    );

    window.addEventListener(
      "storage",
      handleAlertStorageUpdate,
    );

    return () => {
      window.removeEventListener(
        ALERT_EVENT_NAME,
        handleAlertUpdate,
      );

      window.removeEventListener(
        "storage",
        handleAlertStorageUpdate,
      );
    };
  }, [loadNotifications]);

  const saveUpdatedSettings = (
    changedSettings,
  ) => {
    const updatedSettings = {
      ...appSettings,
      ...changedSettings,
    };

    setAppSettings(updatedSettings);

    localStorage.setItem(
      "NETRA-settings",
      JSON.stringify(updatedSettings),
    );

    window.dispatchEvent(
      new CustomEvent(
        "NETRA-settings-updated",
        {
          detail: updatedSettings,
        },
      ),
    );

    return updatedSettings;
  };

  const saveAcknowledgedAlertIds = (ids) => {
    const uniqueIds = [
      ...new Set(ids.map(String)),
    ];

    localStorage.setItem(
      ALERT_STORAGE_KEY,
      JSON.stringify(uniqueIds),
    );

    window.dispatchEvent(
      new CustomEvent(ALERT_EVENT_NAME, {
        detail: uniqueIds,
      }),
    );
  };

  const handleSearch = (event) => {
    event.preventDefault();

    const query = searchText.trim();

    if (!query) {
      return;
    }

    navigate(
      `/case-search?q=${encodeURIComponent(query)}`,
    );
  };

  const handleDateChange = (value) => {
    saveUpdatedSettings({
      dateRange: value,
    });

    window.dispatchEvent(
      new CustomEvent(
        "NETRA-date-range-change",
        {
          detail: value,
        },
      ),
    );

    setOpenMenu(null);
  };

  const handleLanguageChange = (value) => {
    saveUpdatedSettings({
      language: value,
    });

    window.dispatchEvent(
      new CustomEvent(
        "NETRA-language-change",
        {
          detail: value,
        },
      ),
    );

    setOpenMenu(null);
  };

  const markNotificationRead = (id) => {
    const normalizedId = String(id);

    const acknowledgedIds =
      loadAcknowledgedAlertIds();

    if (
      !acknowledgedIds.includes(normalizedId)
    ) {
      acknowledgedIds.push(normalizedId);
    }

    saveAcknowledgedAlertIds(
      acknowledgedIds,
    );

    setNotifications((current) =>
      current.map((notification) =>
        String(notification.id) ===
        normalizedId
          ? {
              ...notification,
              unread: false,
            }
          : notification,
      ),
    );
  };

  const markAllNotificationsRead = () => {
    const acknowledgedIds =
      loadAcknowledgedAlertIds();

    const visibleNotificationIds =
      notifications.map((notification) =>
        String(notification.id),
      );

    saveAcknowledgedAlertIds([
      ...acknowledgedIds,
      ...visibleNotificationIds,
    ]);

    setNotifications((current) =>
      current.map((notification) => ({
        ...notification,
        unread: false,
      })),
    );
  };

  const handleLogout = () => {
    logout();
    setOpenMenu(null);
    navigate("/login", {
      replace: true,
    });
  };

  return (
    <header
      ref={topbarRef}
      className={[
        "fixed right-0 top-0 z-30 h-18",
        "border-b border-edge bg-surface/90 backdrop-blur-xl",
        "transition-[left] duration-300",
        sidebarCollapsed
          ? "left-20"
          : "left-72",
      ].join(" ")}
    >
      <div className="flex h-full items-center justify-between gap-4 px-5 lg:px-8">
        <button
          type="button"
          onClick={onOpenMobileSidebar}
          className="rounded-lg p-2 text-ink-secondary hover:bg-white/5 lg:hidden"
          aria-label="Open navigation"
        >
          <Menu size={22} />
        </button>

        {/* Functional search */}
        <form
          onSubmit={handleSearch}
          className="hidden max-w-md flex-1 md:block"
        >
          <label className="relative block">
            <Search
              size={18}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted"
            />

            <input
              type="search"
              value={searchText}
              onChange={(event) =>
                setSearchText(
                  event.target.value,
                )
              }
              placeholder="Search case number, accused or district..."
              className={[
                "h-10 w-full rounded-xl border border-edge",
                "bg-canvas/70 pl-10 pr-4 text-sm text-ink",
                "outline-none transition",
                "placeholder:text-ink-muted",
                "focus:border-primary focus:ring-2 focus:ring-primary/20",
              ].join(" ")}
            />
          </label>
        </form>

        <div className="ml-auto flex items-center gap-2">
          {/* Functional date filter */}
          <div
            data-tour="topbar-date"
            className="relative hidden sm:block"
          >
            <button
              type="button"
              onClick={() =>
                setOpenMenu((current) =>
                  current === "date"
                    ? null
                    : "date",
                )
              }
              className="flex items-center gap-2 rounded-xl border border-edge bg-canvas/70 px-3 py-2 text-sm text-ink-secondary transition hover:border-primary/40 hover:text-ink"
            >
              <CalendarDays size={17} />

              <span>
                {selectedDateLabel}
              </span>

              <ChevronDown size={14} />
            </button>

            {openMenu === "date" && (
              <Dropdown className="right-0 w-52">
                {dateOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() =>
                      handleDateChange(
                        option.value,
                      )
                    }
                    className="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm text-ink-secondary hover:bg-white/5 hover:text-ink"
                  >
                    {option.label}

                    {dateRange ===
                      option.value && (
                      <Check
                        size={16}
                        className="text-primary"
                      />
                    )}
                  </button>
                ))}
              </Dropdown>
            )}
          </div>

          {/* Functional language menu */}
          <div className="relative">
            <button
              type="button"
              onClick={() =>
                setOpenMenu((current) =>
                  current === "language"
                    ? null
                    : "language",
                )
              }
              className="flex items-center gap-2 rounded-xl border border-edge bg-canvas/70 px-3 py-2 text-sm text-ink-secondary transition hover:border-primary/40 hover:text-ink"
            >
              <Languages size={17} />

              <span className="hidden sm:inline">
                {selectedLanguageLabel}
              </span>

              <ChevronDown
                size={14}
                className="hidden sm:block"
              />
            </button>

            {openMenu === "language" && (
              <Dropdown className="right-0 w-56">
                {languageOptions.map(
                  (option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() =>
                        handleLanguageChange(
                          option.value,
                        )
                      }
                      className="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm text-ink-secondary hover:bg-white/5 hover:text-ink"
                    >
                      {option.label}

                      {language ===
                        option.value && (
                        <Check
                          size={16}
                          className="text-primary"
                        />
                      )}
                    </button>
                  ),
                )}
              </Dropdown>
            )}
          </div>

          {/* Dataset-backed notifications */}
          <div className="relative">
            <button
              type="button"
              disabled={
                !appSettings.notificationsEnabled
              }
              onClick={() =>
                setOpenMenu((current) =>
                  current === "notifications"
                    ? null
                    : "notifications",
                )
              }
              className="relative rounded-xl border border-edge bg-canvas/70 p-2.5 text-ink-secondary transition hover:border-primary/40 hover:text-ink disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Notifications"
            >
              <Bell size={18} />

              {appSettings.notificationsEnabled &&
                unreadCount > 0 && (
                  <span className="absolute right-2 top-2 size-2 rounded-full bg-red-500" />
                )}
            </button>

            {openMenu === "notifications" &&
              appSettings.notificationsEnabled && (
                <Dropdown className="right-0 w-[360px]">
                  <div className="flex items-center justify-between border-b border-edge px-4 py-3">
                    <div>
                      <h3 className="font-semibold text-white">
                        Notifications
                      </h3>

                      <p className="mt-1 text-xs text-ink-muted">
                        {notificationsLoading
                          ? "Loading..."
                          : `${unreadCount} unread`}
                      </p>
                    </div>

                    {!notificationsLoading &&
                      unreadCount > 0 && (
                        <button
                          type="button"
                          onClick={
                            markAllNotificationsRead
                          }
                          className="text-xs font-medium text-primary hover:text-primary-hover"
                        >
                          Mark all read
                        </button>
                      )}
                  </div>

                  <div className="max-h-80 overflow-y-auto p-2">
                    {notificationsLoading ? (
                      <div className="flex min-h-32 items-center justify-center px-4">
                        <p className="text-sm text-ink-secondary">
                          Loading dataset alerts...
                        </p>
                      </div>
                    ) : notifications.length === 0 ? (
                      <div className="flex min-h-32 items-center justify-center px-4 text-center">
                        <p className="text-sm text-ink-secondary">
                          No intelligence alerts are
                          available.
                        </p>
                      </div>
                    ) : (
                      notifications.map(
                        (notification) => (
                          <button
                            key={notification.id}
                            type="button"
                            onClick={() => {
                              markNotificationRead(
                                notification.id,
                              );

                              setOpenMenu(null);
                              navigate("/alerts");
                            }}
                            className={[
                              "w-full rounded-xl p-3 text-left transition hover:bg-white/5",
                              notification.unread
                                ? "bg-primary/5"
                                : "",
                            ].join(" ")}
                          >
                            <div className="flex items-start gap-3">
                              <span
                                className={[
                                  "mt-1.5 size-2 shrink-0 rounded-full",
                                  notification.unread
                                    ? severityDotClass(
                                        notification.severity,
                                      )
                                    : "bg-surface-raised",
                                ].join(" ")}
                              />

                              <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <p className="text-sm font-medium text-white">
                                    {notification.title}
                                  </p>

                                  <span
                                    className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${severityBadgeClass(
                                      notification.severity,
                                    )}`}
                                  >
                                    {
                                      notification.severity
                                    }
                                  </span>
                                </div>

                                <p className="mt-1 text-xs leading-5 text-ink-secondary">
                                  {
                                    notification.description
                                  }
                                </p>

                                <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-slate-600">
                                  {notification.district && (
                                    <span>
                                      {
                                        notification.district
                                      }
                                    </span>
                                  )}

                                  {notification.caseCount >
                                    0 && (
                                    <span>
                                      {notification.caseCount.toLocaleString(
                                        "en-IN",
                                      )}{" "}
                                      cases
                                    </span>
                                  )}

                                  <span>
                                    {notification.unread
                                      ? "New"
                                      : "Acknowledged"}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </button>
                        ),
                      )
                    )}
                  </div>

                  <div className="border-t border-edge p-2">
                    <button
                      type="button"
                      onClick={() => {
                        setOpenMenu(null);
                        navigate("/alerts");
                      }}
                      className="w-full rounded-lg py-2 text-sm font-medium text-primary-hover hover:bg-white/5 hover:text-primary"
                    >
                      View all alerts
                    </button>
                  </div>
                </Dropdown>
              )}
          </div>

          {/* Functional profile */}
          <div className="relative">
            <button
              type="button"
              onClick={() =>
                setOpenMenu((current) =>
                  current === "profile"
                    ? null
                    : "profile",
                )
              }
              className="ml-1 flex size-10 items-center justify-center rounded-xl bg-primary font-semibold text-white hover:bg-primary-hover"
              aria-label="Open user profile"
            >
              {user?.initials || "KP"}
            </button>

            {openMenu === "profile" && (
              <Dropdown className="right-0 w-64">
                <div className="border-b border-edge px-4 py-4">
                  <p className="font-semibold text-white">
                    {user?.name || "State Police"}
                  </p>

                  <p className="mt-1 text-xs text-ink-muted">
                    {user?.role || "Crime Intelligence Analyst"}
                  </p>
                </div>

                <div className="p-2">
                  <MenuButton
                    icon={UserRound}
                    label="View profile"
                    onClick={() => {
                      setOpenMenu(null);
                      navigate("/profile");
                    }}
                  />

                  <MenuButton
                    icon={Settings}
                    label="Settings"
                    onClick={() => {
                      setOpenMenu(null);
                      navigate("/settings");
                    }}
                  />

                  <div className="my-2 border-t border-edge" />

                  <MenuButton
                    icon={LogOut}
                    label="Sign out"
                    danger
                    onClick={handleLogout}
                  />
                </div>
              </Dropdown>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

function Dropdown({
  children,
  className = "",
}) {
  return (
    <div
      className={[
        "absolute top-[48px] z-50 overflow-hidden rounded-2xl",
        "border border-edge bg-surface p-2 shadow-card",
        className,
      ].join(" ")}
    >
      {children}
    </div>
  );
}

function MenuButton({
  icon: Icon,
  label,
  onClick,
  danger = false,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition",
        danger
          ? "text-critical-soft hover:bg-critical/10"
          : "text-ink-secondary hover:bg-white/5 hover:text-ink",
      ].join(" ")}
    >
      <Icon size={17} />
      {label}
    </button>
  );
}

function normalizeSeverity(value) {
  const severity = String(value ?? "")
    .trim()
    .toLowerCase();

  if (
    severity === "critical" ||
    severity === "severe"
  ) {
    return "Critical";
  }

  if (severity === "high") {
    return "High";
  }

  if (
    severity === "medium" ||
    severity === "moderate"
  ) {
    return "Medium";
  }

  return "Low";
}

function severityRank(severity) {
  const ranks = {
    Critical: 4,
    High: 3,
    Medium: 2,
    Low: 1,
  };

  return ranks[severity] ?? 0;
}

function severityDotClass(severity) {
  if (severity === "Critical") {
    return "bg-critical";
  }

  if (severity === "High") {
    return "bg-critical-soft";
  }

  if (severity === "Medium") {
    return "bg-watch";
  }

  return "bg-resolved";
}

function severityBadgeClass(severity) {
  if (severity === "Critical") {
    return "border border-critical/30 bg-critical/10 text-critical-soft";
  }

  if (severity === "High") {
    return "border border-critical/25 bg-critical/10 text-critical-soft";
  }

  if (severity === "Medium") {
    return "border border-watch/30 bg-watch/10 text-watch-soft";
  }

  return "border border-resolved/30 bg-resolved/10 text-resolved-soft";
}

function toNumber(value) {
  const number = Number(value);

  return Number.isFinite(number)
    ? number
    : 0;
}