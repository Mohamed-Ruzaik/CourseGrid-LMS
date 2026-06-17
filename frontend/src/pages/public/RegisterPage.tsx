import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { CheckCircle2, Eye, EyeOff, LockKeyhole, Mail, UserRound } from "lucide-react";
import { useAuth } from "../../auth/AuthContext";
import { AuthShell } from "../../components/AuthShell";
import type { UserRole } from "../../types/auth";

function getErrorMessage(error: unknown) {
  if (typeof error === "object" && error && "response" in error) {
    const response = (error as { response?: { data?: { detail?: string } } }).response;
    return response?.data?.detail ?? "Registration failed. Check the form and try again.";
  }

  return "Registration failed. Check your connection and try again.";
}

export function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("student");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");
    setIsSubmitting(true);

    try {
      await register({ name, email, password, role });
      setSuccess("Account created successfully. Redirecting to sign in...");
      setTimeout(() => navigate("/login"), 800);
    } catch (submitError) {
      setError(getErrorMessage(submitError));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthShell
      documentTitle="CourseGrid | Register"
      eyebrow="MVP account"
      title="Create Account"
      subtitle="Register to start your learning journey."
    >
      <form className="space-y-5" onSubmit={handleSubmit}>
        <div className="space-y-1.5">
          <label
            htmlFor="name"
            className="ml-4 text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500"
          >
            Full Name
          </label>
          <div className="flex h-12 items-center rounded-full border border-slate-200 bg-slate-50/50 px-5 transition-all focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/50 dark:border-slate-800 dark:bg-slate-900">
            <UserRound className="h-4 w-4 text-slate-400" aria-hidden="true" />
            <input
              id="name"
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
              minLength={2}
              placeholder="John Doe"
              className="ml-3 min-w-0 flex-1 border-0 bg-transparent text-sm font-medium text-slate-800 outline-none placeholder:text-slate-400 dark:text-white"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="email"
            className="ml-4 text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500"
          >
            Email Address
          </label>
          <div className="flex h-12 items-center rounded-full border border-slate-200 bg-slate-50/50 px-5 transition-all focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/50 dark:border-slate-800 dark:bg-slate-900">
            <Mail className="h-4 w-4 text-slate-400" aria-hidden="true" />
            <input
              id="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              placeholder="student@coursegrid.com"
              className="ml-3 min-w-0 flex-1 border-0 bg-transparent text-sm font-medium text-slate-800 outline-none placeholder:text-slate-400 dark:text-white"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="password"
            className="ml-4 text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500"
          >
            Password
          </label>
          <div className="flex h-12 items-center rounded-full border border-slate-200 bg-slate-50/50 px-5 transition-all focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/50 dark:border-slate-800 dark:bg-slate-900">
            <LockKeyhole className="h-4 w-4 text-slate-400" aria-hidden="true" />
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              minLength={8}
              placeholder="Minimum 8 characters"
              className="ml-3 min-w-0 flex-1 border-0 bg-transparent text-sm font-medium text-slate-800 outline-none placeholder:text-slate-400 dark:text-white"
            />
            <button
              type="button"
              onClick={() => setShowPassword((current) => !current)}
              className="ml-2 rounded-full p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" aria-hidden="true" />
              ) : (
                <Eye className="h-4 w-4" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="role"
            className="ml-4 text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500"
          >
            System Role
          </label>
          <select
            id="role"
            value={role}
            onChange={(event) => setRole(event.target.value as UserRole)}
            className="h-12 w-full cursor-pointer appearance-none rounded-full border border-slate-200 bg-slate-50/50 px-5 text-sm font-medium text-slate-800 outline-none transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/50 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
          >
            <option value="student">Student</option>
            <option value="instructor">Instructor</option>
            <option value="admin">Administrator</option>
          </select>
        </div>

        {error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-center text-sm font-medium text-red-600 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
            {error}
          </div>
        ) : null}

        {success ? (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-600 dark:border-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-400">
            <div className="flex items-center justify-center gap-2">
              <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
              {success}
            </div>
          </div>
        ) : null}

        <button
          type="submit"
          disabled={isSubmitting}
          className="mt-6 h-12 w-full rounded-full bg-indigo-600 text-sm font-bold text-white shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:bg-indigo-500 hover:shadow-lg active:scale-95 disabled:cursor-not-allowed disabled:opacity-70 disabled:transform-none dark:bg-indigo-500 dark:text-slate-950 dark:hover:bg-indigo-400"
        >
          {isSubmitting ? "Processing..." : "Initialize Account"}
        </button>
      </form>

      <div className="mt-8 text-center text-sm">
        <span className="font-medium text-slate-500 dark:text-slate-400">
          Already registered?
        </span>
        <Link
          to="/login"
          className="ml-2 font-bold text-indigo-600 underline-offset-4 hover:underline dark:text-indigo-400"
        >
          Sign In
        </Link>
      </div>
    </AuthShell>
  );
}
