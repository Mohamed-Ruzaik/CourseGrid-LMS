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
      title="Create Account"
      subtitle="Create your CourseGrid LMS account."
    >
      <form className="space-y-5" onSubmit={handleSubmit}>
        <div>
          <label
            htmlFor="name"
            className="text-sm font-bold text-slate-800"
          >
            Full name
          </label>
          <div className="mt-3 flex h-12 items-center rounded-lg border border-slate-200 bg-white px-4 transition focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-100">
            <UserRound className="h-5 w-5 text-slate-400" aria-hidden="true" />
            <input
              id="name"
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
              minLength={2}
              placeholder="John Doe"
              className="ml-3 min-w-0 flex-1 border-0 bg-transparent text-base font-medium text-slate-900 outline-none placeholder:text-slate-400"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="email"
            className="text-sm font-bold text-slate-800"
          >
            Email address
          </label>
          <div className="mt-3 flex h-12 items-center rounded-lg border border-slate-200 bg-white px-4 transition focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-100">
            <Mail className="h-5 w-5 text-slate-400" aria-hidden="true" />
            <input
              id="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              placeholder="you@example.com"
              className="ml-3 min-w-0 flex-1 border-0 bg-transparent text-base font-medium text-slate-900 outline-none placeholder:text-slate-400"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="password"
            className="text-sm font-bold text-slate-800"
          >
            Password
          </label>
          <div className="mt-3 flex h-12 items-center rounded-lg border border-slate-200 bg-white px-4 transition focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-100">
            <LockKeyhole className="h-5 w-5 text-slate-400" aria-hidden="true" />
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              minLength={8}
              placeholder="Minimum 8 characters"
              className="ml-3 min-w-0 flex-1 border-0 bg-transparent text-base font-medium text-slate-900 outline-none placeholder:text-slate-400"
            />
            <button
              type="button"
              onClick={() => setShowPassword((current) => !current)}
              className="ml-2 rounded-md p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <EyeOff className="h-5 w-5" aria-hidden="true" />
              ) : (
                <Eye className="h-5 w-5" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>

        <div>
          <label
            htmlFor="role"
            className="text-sm font-bold text-slate-800"
          >
            System Role
          </label>
          <select
            id="role"
            value={role}
            onChange={(event) => setRole(event.target.value as UserRole)}
            className="mt-3 h-12 w-full cursor-pointer rounded-lg border border-slate-200 bg-white px-4 text-base font-medium text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
          >
            <option value="student">Student</option>
            <option value="instructor">Instructor</option>
            <option value="admin">Administrator</option>
          </select>
        </div>

        {error ? (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-center text-sm font-medium text-red-600">
            {error}
          </div>
        ) : null}

        {success ? (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-600">
            <div className="flex items-center justify-center gap-2">
              <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
              {success}
            </div>
          </div>
        ) : null}

        <button
          type="submit"
          disabled={isSubmitting}
          className="h-12 w-full rounded-lg bg-blue-600 text-base font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isSubmitting ? "Processing..." : "Create account"}
        </button>
      </form>

      <div className="my-7 flex items-center gap-5 text-sm text-slate-400">
        <span className="h-px flex-1 bg-slate-200" />
        or
        <span className="h-px flex-1 bg-slate-200" />
      </div>

      <div>
        <Link
          to="/login"
          className="flex h-12 w-full items-center justify-center rounded-lg border border-slate-200 bg-white text-base font-semibold text-blue-600 transition hover:border-blue-200 hover:bg-blue-50"
        >
          Sign in
        </Link>
      </div>
    </AuthShell>
  );
}
