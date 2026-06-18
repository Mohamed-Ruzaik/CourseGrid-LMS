import { FormEvent, useEffect, useState } from "react";
import { BadgeCheck, IdCard, Mail, UserRound } from "lucide-react";
import { useAuth } from "../../auth/AuthContext";
import { MessageBox } from "../../components/MessageBox";
import type { UserRole } from "../../types/auth";
import { getApiErrorMessage } from "../../utils/errorMessage";

function getRoleIdLabel(role: UserRole) {
  if (role === "student") {
    return "Student ID";
  }

  if (role === "instructor") {
    return "Instructor ID";
  }

  return "Admin ID";
}

function formatRole(role: UserRole) {
  return role.charAt(0).toUpperCase() + role.slice(1);
}

type DetailTileProps = {
  icon: typeof Mail;
  label: string;
  value: string;
};

function DetailTile({ icon: Icon, label, value }: DetailTileProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-4">
      <div className="flex items-center gap-3">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-blue-50 text-blue-600">
          <Icon className="h-5 w-5" aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
          <p className="truncate text-sm font-semibold text-slate-950">{value}</p>
        </div>
      </div>
    </div>
  );
}

export function SettingsPage() {
  const { user, updateProfile } = useAuth();
  const [name, setName] = useState(user?.name ?? "");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    setName(user?.name ?? "");
  }, [user?.name]);

  if (!user) {
    return null;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");

    const trimmedName = name.trim();
    if (!trimmedName) {
      setError("Name is required.");
      return;
    }

    try {
      setIsSaving(true);
      await updateProfile({ name: trimmedName });
      setSuccess("Profile updated successfully.");
    } catch (updateError) {
      setError(getApiErrorMessage(updateError, "Unable to update profile right now."));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">Account</p>
            <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-950">Profile settings</h2>
            <p className="mt-2 max-w-2xl text-sm text-slate-600">
              Keep your CourseGrid profile details accurate across dashboards and course activity.
            </p>
          </div>
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-100 text-blue-600">
            <UserRound className="h-7 w-7" aria-hidden="true" />
          </div>
        </div>

        <form className="mt-7 space-y-6" onSubmit={handleSubmit}>
          <div>
            <label className="text-sm font-semibold text-slate-800" htmlFor="profile-name">
              Name
            </label>
            <input
              id="profile-name"
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-950 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              placeholder="Enter your name"
              autoComplete="name"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <DetailTile icon={Mail} label="Email" value={user.email} />
            <DetailTile icon={IdCard} label={getRoleIdLabel(user.role)} value={`#${user.id}`} />
            <DetailTile icon={BadgeCheck} label="Role" value={formatRole(user.role)} />
          </div>

          {error ? <MessageBox tone="error">{error}</MessageBox> : null}
          {success ? <MessageBox tone="success">{success}</MessageBox> : null}

          <div className="flex flex-col gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-slate-500">Email, role, and ID are managed by the system.</p>
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
            >
              {isSaving ? "Saving..." : "Save changes"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
