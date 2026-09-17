import {
  BadgeCheck,
  Building2,
  Mail,
  MapPin,
  Save,
  ShieldCheck,
  UserRound,
} from "lucide-react";

import {
  useEffect,
  useState,
} from "react";

import PageHeader from "../components/common/PageHeader";
import { useAuth } from "../context/AuthContext";
import { addAuditLog } from "../utils/auditLogger";

function Profile() {
  const {
    user,
    updateProfile,
  } = useAuth();

  const [form, setForm] = useState({
    name: "",
    email: "",
    employeeId: "",
    role: "",
    department: "",
    district: "",
    phone: "",
  });

  const [saved, setSaved] =
    useState(false);

  useEffect(() => {
    setForm({
      name: user?.name || "",
      email: user?.email || "",
      employeeId:
        user?.employeeId || "",
      role: user?.role || "",
      department:
        user?.department || "",
      district:
        user?.district || "",
      phone: user?.phone || "",
    });
  }, [user]);

  function updateField(name, value) {
    setSaved(false);

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  function handleSubmit(event) {
    event.preventDefault();

    const initials = form.name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase();

    updateProfile({
      ...form,
      initials: initials || "KP",
    });

    addAuditLog({
      action: "Updated user profile",
      resource: form.employeeId || form.email,
      category: "Profile",
      status: "Success",
    });

    setSaved(true);
  }

  return (
    <div className="flex h-full min-h-0 flex-col bg-canvas">
      <PageHeader
        icon={UserRound}
        title="User Profile"
        description="Review and update your authorised NETRA AI account"
      />

      <main className="min-h-0 flex-1 overflow-y-auto p-5">
        {saved && (
          <div className="mb-5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
            Profile updated successfully.
          </div>
        )}

        <div className="grid gap-5 xl:grid-cols-[330px_minmax(0,1fr)]">
          <aside className="rounded-2xl border border-edge bg-surface p-6">
            <div className="flex flex-col items-center text-center">
              <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-primary text-3xl font-bold text-white">
                {user?.initials || "KP"}
              </div>

              <h2 className="mt-5 text-xl font-bold tracking-tight text-ink">
                {user?.name || "State Police"}
              </h2>

              <p className="mt-2 text-sm text-ink-secondary">
                {user?.role || "Crime Intelligence Analyst"}
              </p>

              <span className="mt-4 inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400">
                <BadgeCheck size={15} />
                Authorised user
              </span>
            </div>

            <div className="mt-6 space-y-3 border-t border-edge pt-6">
              <ProfileInfo
                icon={Mail}
                label="Email"
                value={user?.email}
              />

              <ProfileInfo
                icon={ShieldCheck}
                label="Employee ID"
                value={user?.employeeId}
              />

              <ProfileInfo
                icon={Building2}
                label="Department"
                value={user?.department}
              />

              <ProfileInfo
                icon={MapPin}
                label="District"
                value={user?.district}
              />
            </div>
          </aside>

          <section className="rounded-2xl border border-edge bg-surface p-6">
            <div>
              <h2 className="font-semibold text-ink">
                Profile information
              </h2>

              <p className="mt-1 text-sm text-ink-secondary">
                Update the account information shown in the platform.
              </p>
            </div>

            <form
              onSubmit={handleSubmit}
              className="mt-6 grid gap-5 md:grid-cols-2"
            >
              <ProfileField
                label="Full name"
                value={form.name}
                onChange={(value) =>
                  updateField("name", value)
                }
              />

              <ProfileField
                label="Email address"
                type="email"
                value={form.email}
                onChange={(value) =>
                  updateField("email", value)
                }
              />

              <ProfileField
                label="Employee ID"
                value={form.employeeId}
                onChange={(value) =>
                  updateField("employeeId", value)
                }
              />

              <ProfileField
                label="Role"
                value={form.role}
                onChange={(value) =>
                  updateField("role", value)
                }
              />

              <ProfileField
                label="Department"
                value={form.department}
                onChange={(value) =>
                  updateField("department", value)
                }
              />

              <ProfileField
                label="District"
                value={form.district}
                onChange={(value) =>
                  updateField("district", value)
                }
              />

              <ProfileField
                label="Phone number"
                value={form.phone}
                onChange={(value) =>
                  updateField("phone", value)
                }
              />

              <div className="flex items-end">
                <button
                  type="submit"
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-white transition hover:bg-primary-hover"
                >
                  <Save size={17} />
                  Save profile
                </button>
              </div>
            </form>
          </section>
        </div>
      </main>
    </div>
  );
}

function ProfileInfo({
  icon: Icon,
  label,
  value,
}) {
  return (
    <div className="flex gap-3">
      <Icon
        size={17}
        className="mt-0.5 shrink-0 text-primary-hover"
      />

      <div className="min-w-0">
        <p className="text-xs text-ink-muted">
          {label}
        </p>

        <p className="mt-1 break-words text-sm text-slate-300">
          {value || "Not available"}
        </p>
      </div>
    </div>
  );
}

function ProfileField({
  label,
  value,
  onChange,
  type = "text",
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-slate-300">
        {label}
      </span>

      <input
        type={type}
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        className="w-full rounded-xl border border-edge bg-canvas/70 px-4 py-3 text-sm text-ink outline-none focus:border-primary"
      />
    </label>
  );
}

export default Profile;