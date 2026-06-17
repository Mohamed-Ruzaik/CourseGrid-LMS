import { FormEvent, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Eye, EyeOff, LockKeyhole, Mail } from "lucide-react";
import { useAuth } from "../../auth/AuthContext";
import { dashboardPathForRole } from "../../auth/roleRedirect";
import { AuthShell } from "../../components/AuthShell";

function getErrorMessage(error: unknown) {
  if (typeof error === "object" && error && "response" in error) {
    const response = (error as { response?: { data?: { detail?: string } } }).response;
    return response?.data?.detail ?? "Login failed. Check your credentials.";
  }

  return "Login failed. Check your connection and try again.";
}

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const user = await login({ email, password });
      const from = (location.state as { from?: string } | null)?.from;
      navigate(from ?? dashboardPathForRole(user.role), { replace: true });
    } catch (submitError) {
      setError(getErrorMessage(submitError));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthShell
      documentTitle="CourseGrid | Login"
      title="Welcome back"
      subtitle="Let's continue your learning journey."
    >
      <form className="space-y-6" onSubmit={handleSubmit}>
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
              placeholder="Enter your password"
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

        <div className="flex items-center justify-between gap-4 text-sm">
          <label className="inline-flex items-center gap-3 font-medium text-slate-600">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(event) => setRememberMe(event.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            Remember me
          </label>
          <button type="button" className="font-semibold text-blue-600 hover:text-blue-700">
            Forgot password?
          </button>
        </div>

        {error ? (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-center text-sm font-medium text-red-600">
            {error}
          </div>
        ) : null}

        <button
          type="submit"
          disabled={isSubmitting}
          className="h-12 w-full rounded-lg bg-blue-600 text-base font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isSubmitting ? "Signing in..." : "Sign in"}
        </button>
      </form>

      <div className="my-7 flex items-center gap-5 text-sm text-slate-400">
        <span className="h-px flex-1 bg-slate-200" />
        or
        <span className="h-px flex-1 bg-slate-200" />
      </div>

      <div>
        <Link
          to="/register"
          className="flex h-12 w-full items-center justify-center rounded-lg border border-slate-200 bg-white text-base font-semibold text-blue-600 transition hover:border-blue-200 hover:bg-blue-50"
        >
          Create account
        </Link>
      </div>
    </AuthShell>
  );
}
