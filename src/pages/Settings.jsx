import {
  Bell,
  Database,
  Languages,
  LockKeyhole,
  RotateCcw,
  Save,
} from "lucide-react";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import PageHeader from "../components/common/PageHeader";
import { api } from "../services/api";
import { addAuditLog } from "../utils/auditLogger";

const SETTINGS_KEY = "NETRA-settings";
const SETTINGS_EVENT = "NETRA-settings-updated";

const DEFAULT_SETTINGS = {
  language: "English + ಕನ್ನಡ",
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

function loadSavedSettings() {
  try {
    const saved = JSON.parse(
      localStorage.getItem(SETTINGS_KEY) ||
        "{}",
    );

    return {
      ...DEFAULT_SETTINGS,
      ...saved,
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

function Settings() {
  const [settings, setSettings] =
    useState(loadSavedSettings);

  const [savedSettings, setSavedSettings] =
    useState(loadSavedSettings);

  const [districts, setDistricts] =
    useState([]);

  const [statuses, setStatuses] =
    useState([]);

  const [loadingLookups, setLoadingLookups] =
    useState(true);

  const [message, setMessage] =
    useState("");

  const [messageType, setMessageType] =
    useState("success");

  useEffect(() => {
    let active = true;

    async function loadDatasetOptions() {
      setLoadingLookups(true);

      try {
        const [
          districtsResponse,
          lookupsResponse,
        ] = await Promise.all([
          api.districts(),
          api.lookups(),
        ]);

        if (!active) {
          return;
        }

        const districtSource =
          districtsResponse?.districts ??
          districtsResponse?.data
            ?.districts ??
          districtsResponse?.data ??
          districtsResponse ??
          [];

        const lookupData =
          lookupsResponse?.data ??
          lookupsResponse ??
          {};

        const statusSource =
          lookupData.statuses ??
          lookupData.caseStatuses ??
          lookupData.CaseStatusMaster ??
          [];

        setDistricts(
          normalizeDistricts(
            districtSource,
          ),
        );

        setStatuses(
          normalizeStatuses(statusSource),
        );
      } catch (error) {
        console.error(
          "Unable to load settings options:",
          error,
        );

        showMessage(
          "Dataset filters could not be loaded.",
          "error",
        );
      } finally {
        if (active) {
          setLoadingLookups(false);
        }
      }
    }

    loadDatasetOptions();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    applyInterfaceSettings(settings);
  }, [settings]);

  useEffect(() => {
    if (!message) {
      return undefined;
    }

    const timeout = setTimeout(() => {
      setMessage("");
    }, 3000);

    return () => clearTimeout(timeout);
  }, [message]);

  const hasChanges = useMemo(
    () =>
      JSON.stringify(settings) !==
      JSON.stringify(savedSettings),
    [settings, savedSettings],
  );

  function showMessage(
    text,
    type = "success",
  ) {
    setMessage(text);
    setMessageType(type);
  }

  function updateSetting(name, value) {
    setSettings((current) => ({
      ...current,
      [name]: value,
    }));
  }

  function updateDistrict(event) {
    const districtId =
      event.target.value;

    if (districtId === "All") {
      setSettings((current) => ({
        ...current,
        defaultDistrictId: "All",
        defaultDistrictName:
          "All Districts",
      }));

      return;
    }

    const selected =
      districts.find(
        (district) =>
          district.id === districtId,
      );

    setSettings((current) => ({
      ...current,
      defaultDistrictId: districtId,
      defaultDistrictName:
        selected?.name ??
        "All Districts",
    }));
  }

  function updateStatus(event) {
    const statusId =
      event.target.value;

    if (statusId === "All") {
      setSettings((current) => ({
        ...current,
        defaultStatusId: "All",
        defaultStatusName:
          "All statuses",
      }));

      return;
    }

    const selected =
      statuses.find(
        (status) =>
          status.id === statusId,
      );

    setSettings((current) => ({
      ...current,
      defaultStatusId: statusId,
      defaultStatusName:
        selected?.name ??
        "All statuses",
    }));
  }

  function saveSettings() {
    try {
      localStorage.setItem(
        SETTINGS_KEY,
        JSON.stringify(settings),
      );

      setSavedSettings(settings);

      applyInterfaceSettings(settings);

      window.dispatchEvent(
        new CustomEvent(
          SETTINGS_EVENT,
          {
            detail: settings,
          },
        ),
      );

      if (
        settings.auditLoggingEnabled
      ) {
        addAuditLog({
          action:
            "Updated application settings",
          resource:
            "Interface and dataset preferences",
          category: "Settings",
          status: "Success",
        });
      }

      showMessage(
        "Settings saved successfully.",
      );
    } catch (error) {
      console.error(
        "Unable to save settings:",
        error,
      );

      showMessage(
        "Settings could not be saved.",
        "error",
      );
    }
  }

  function resetSettings() {
    const resetValues = {
      ...DEFAULT_SETTINGS,
    };

    setSettings(resetValues);
    setSavedSettings(resetValues);

    localStorage.setItem(
      SETTINGS_KEY,
      JSON.stringify(resetValues),
    );

    applyInterfaceSettings(
      resetValues,
    );

    window.dispatchEvent(
      new CustomEvent(
        SETTINGS_EVENT,
        {
          detail: resetValues,
        },
      ),
    );

    addAuditLog({
      action:
        "Reset application settings",
      resource:
        "Default application preferences",
      category: "Settings",
      status: "Success",
    });

    showMessage(
      "Settings reset to defaults.",
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col bg-canvas">
      <PageHeader
        icon={Database}
        title="Settings"
        description="Configure interface, alerts, security and dataset preferences"
        action={
          <div className="flex gap-3">
            <button
              type="button"
              onClick={resetSettings}
              className="flex items-center gap-2 rounded-xl border border-secondary/30 bg-surface px-4 py-2.5 text-sm font-medium text-slate-300 transition hover:border-secondary hover:text-violet-200"
            >
              <RotateCcw size={17} />
              Reset
            </button>

            <button
              type="button"
              disabled={!hasChanges}
              onClick={saveSettings}
              className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-white transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Save size={17} />
              Save settings
            </button>
          </div>
        }
      />

      <main className="min-h-0 flex-1 overflow-y-auto p-5">
        {message && (
          <div
            className={`mb-5 rounded-xl border px-4 py-3 text-sm ${
              messageType === "error"
                ? "border-red-500/30 bg-red-500/10 text-red-300"
                : "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
            }`}
          >
            {message}
          </div>
        )}

        <div className="grid gap-5 xl:grid-cols-2">
          <SettingsCard
            icon={Languages}
            title="Language and display"
            description="Configure the dashboard interface."
          >
            <SettingField label="Default language">
              <select
                value={settings.language}
                onChange={(event) =>
                  updateSetting(
                    "language",
                    event.target.value,
                  )
                }
                className="settings-select"
              >
                <option value="English">
                  English
                </option>

                <option value="ಕನ್ನಡ">
                  ಕನ್ನಡ
                </option>

                <option value="English + ಕನ್ನಡ">
                  English + ಕನ್ನಡ
                </option>
              </select>
            </SettingField>

            <SettingField label="Default date range">
              <select
                value={settings.dateRange}
                onChange={(event) =>
                  updateSetting(
                    "dateRange",
                    event.target.value,
                  )
                }
                className="settings-select"
              >
                <option value="Last 7 days">
                  Last 7 days
                </option>

                <option value="Last 30 days">
                  Last 30 days
                </option>

                <option value="Last 3 months">
                  Last 3 months
                </option>

                <option value="Last 6 months">
                  Last 6 months
                </option>

                <option value="Last 12 months">
                  Last 12 months
                </option>

                <option value="All time">
                  All time
                </option>
              </select>
            </SettingField>

            <ToggleRow
              title="Compact interface"
              description="Reduce spacing and card sizes."
              checked={
                settings.compactInterface
              }
              onChange={(checked) =>
                updateSetting(
                  "compactInterface",
                  checked,
                )
              }
            />
          </SettingsCard>

          <SettingsCard
            icon={Bell}
            title="Notifications and alerts"
            description="Control intelligence notifications."
          >
            <ToggleRow
              title="Enable notifications"
              description="Show system and intelligence notifications."
              checked={
                settings.notificationsEnabled
              }
              onChange={(checked) =>
                updateSetting(
                  "notificationsEnabled",
                  checked,
                )
              }
            />

            <ToggleRow
              title="Critical crime alerts"
              description="Notify when a critical risk pattern is detected."
              checked={
                settings.criticalAlertsEnabled
              }
              disabled={
                !settings.notificationsEnabled
              }
              onChange={(checked) =>
                updateSetting(
                  "criticalAlertsEnabled",
                  checked,
                )
              }
            />

            <SettingField label="Automatic refresh interval">
              <select
                value={
                  settings.refreshInterval
                }
                onChange={(event) =>
                  updateSetting(
                    "refreshInterval",
                    event.target.value,
                  )
                }
                className="settings-select"
              >
                <option value="Manual">
                  Manual
                </option>

                <option value="Every 1 minute">
                  Every 1 minute
                </option>

                <option value="Every 5 minutes">
                  Every 5 minutes
                </option>

                <option value="Every 15 minutes">
                  Every 15 minutes
                </option>

                <option value="Every 30 minutes">
                  Every 30 minutes
                </option>
              </select>
            </SettingField>
          </SettingsCard>

          <SettingsCard
            icon={LockKeyhole}
            title="Privacy and security"
            description="Configure access and accountability."
          >
            <ToggleRow
              title="Audit logging"
              description="Record searches, reports and sensitive data access."
              checked={
                settings.auditLoggingEnabled
              }
              onChange={(checked) =>
                updateSetting(
                  "auditLoggingEnabled",
                  checked,
                )
              }
            />

            <SettingField label="Session timeout">
              <select
                value={settings.sessionTimeout}
                onChange={(event) =>
                  updateSetting(
                    "sessionTimeout",
                    event.target.value,
                  )
                }
                className="settings-select"
              >
                <option value="15 minutes">
                  15 minutes
                </option>

                <option value="30 minutes">
                  30 minutes
                </option>

                <option value="1 hour">
                  1 hour
                </option>

                <option value="2 hours">
                  2 hours
                </option>

                <option value="Never">
                  Never
                </option>
              </select>
            </SettingField>

            <div className="rounded-xl border border-primary/30 bg-primary/10 p-4">
              <p className="text-sm font-semibold text-primary-hover">
                Security notice
              </p>

              <p className="mt-2 text-xs leading-5 text-ink-secondary">
                Changes to audit logging and
                session controls are saved
                locally for this demonstration
                dashboard.
              </p>
            </div>
          </SettingsCard>

          <SettingsCard
            icon={Database}
            title="Dataset preferences"
            description="Control default dataset filters."
          >
            <SettingField label="Default district">
              <select
                value={
                  settings.defaultDistrictId
                }
                disabled={loadingLookups}
                onChange={updateDistrict}
                className="settings-select"
              >
                <option value="All">
                  All Districts
                </option>

                {districts.map(
                  (district) => (
                    <option
                      key={district.id}
                      value={district.id}
                    >
                      {district.name}
                    </option>
                  ),
                )}
              </select>
            </SettingField>

            <SettingField label="Default case status">
              <select
                value={
                  settings.defaultStatusId
                }
                disabled={loadingLookups}
                onChange={updateStatus}
                className="settings-select"
              >
                <option value="All">
                  All statuses
                </option>

                {statuses.map(
                  (status) => (
                    <option
                      key={status.id}
                      value={status.id}
                    >
                      {status.name}
                    </option>
                  ),
                )}
              </select>
            </SettingField>

            <div className="rounded-xl bg-surface p-4">
              <p className="text-xs text-ink-muted">
                Current preference
              </p>

              <p className="mt-2 text-sm font-semibold text-white">
                {
                  settings.defaultDistrictName
                }
              </p>

              <p className="mt-1 text-xs text-ink-secondary">
                {
                  settings.defaultStatusName
                }
              </p>
            </div>
          </SettingsCard>
        </div>
      </main>
    </div>
  );
}

function SettingsCard({
  icon: Icon,
  title,
  description,
  children,
}) {
  return (
    <section className="rounded-2xl border border-edge bg-surface p-5">
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary-hover">
          <Icon size={22} />
        </div>

        <div>
          <h2 className="font-semibold text-white">
            {title}
          </h2>

          <p className="mt-1 text-sm text-ink-muted">
            {description}
          </p>
        </div>
      </div>

      <div className="mt-6 space-y-4">
        {children}
      </div>
    </section>
  );
}

function SettingField({
  label,
  children,
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-slate-300">
        {label}
      </span>

      {children}
    </label>
  );
}

function ToggleRow({
  title,
  description,
  checked,
  disabled = false,
  onChange,
}) {
  return (
    <div
      className={`flex items-center justify-between gap-5 rounded-xl bg-surface p-4 ${
        disabled ? "opacity-50" : ""
      }`}
    >
      <div>
        <p className="text-sm font-semibold text-white">
          {title}
        </p>

        <p className="mt-1 text-xs text-ink-muted">
          {description}
        </p>
      </div>

      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() =>
          onChange(!checked)
        }
        className={`relative h-6 w-11 shrink-0 rounded-full transition ${
          checked
            ? "bg-primary"
            : "bg-slate-600"
        } disabled:cursor-not-allowed`}
      >
        <span
          className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow transition-all ${
            checked
              ? "left-6"
              : "left-1"
          }`}
        />
      </button>
    </div>
  );
}

function normalizeDistricts(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((district, index) => ({
      id: String(
        district.districtId ??
          district.DistrictID ??
          district.id ??
          index,
      ),

      name:
        district.districtName ??
        district.DistrictName ??
        district.name ??
        "Unknown",
    }))
    .filter(
      (district) =>
        district.id &&
        district.name !== "Unknown",
    )
    .sort((first, second) =>
      first.name.localeCompare(
        second.name,
      ),
    );
}

function normalizeStatuses(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((status, index) => ({
      id: String(
        status.statusId ??
          status.CaseStatusID ??
          status.id ??
          index,
      ),

      name:
        status.statusName ??
        status.CaseStatusName ??
        status.name ??
        status.LookupValue ??
        "Unknown",
    }))
    .filter(
      (status) =>
        status.id &&
        status.name !== "Unknown",
    )
    .sort((first, second) =>
      first.name.localeCompare(
        second.name,
      ),
    );
}

function applyInterfaceSettings(settings) {
  document.documentElement.classList.toggle(
    "NETRA-compact",
    Boolean(
      settings.compactInterface,
    ),
  );

  document.documentElement.dataset.language =
    settings.language;

  document.documentElement.dataset.dateRange =
    settings.dateRange;
}

export default Settings;