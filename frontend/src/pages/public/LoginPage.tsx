import { FormEvent, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  BarChart3,
  BookOpenCheck,
  Eye,
  EyeOff,
  GraduationCap,
  LockKeyhole,
  Mail,
  Sun,
  UsersRound
} from "lucide-react";
import { useAuth } from "../../auth/AuthContext";
import { dashboardPathForRole } from "../../auth/roleRedirect";

function getErrorMessage(error: unknown) {
  if (typeof error === "object" && error && "response" in error) {
    const response = (error as { response?: { data?: { detail?: string } } }).response;
    return response?.data?.detail ?? "Login failed. Check your credentials.";
  }

  return "Login failed. Check your connection and try again.";
}

const featureCards = [
  {
    title: "Quality Content",
    description: "Curated learning materials",
    icon: GraduationCap
  },
  {
    title: "Track Progress",
    description: "Monitor and improve your progress",
    icon: BarChart3
  },
  {
    title: "Achieve Goals",
    description: "Reach your learning goals faster",
    icon: UsersRound
  }
];

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
    <main className="grid min-h-screen bg-[#f8f9ff] text-[#101629] lg:h-screen lg:overflow-hidden lg:grid-cols-[46%_54%]">
      <section className="relative hidden overflow-hidden bg-[#071124] px-10 py-8 text-white lg:flex lg:h-screen lg:flex-col">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_95%_55%,rgba(92,75,235,0.20),transparent_24%),radial-gradient(circle_at_10%_95%,rgba(65,97,255,0.12),transparent_28%)]" />
        <div className="absolute right-[-210px] top-[38%] h-[420px] w-[420px] rounded-full border border-indigo-400/10 bg-indigo-500/5" />
        <div className="relative z-10">
          <Link to="/login" className="inline-flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-[#7c68ff] to-[#4f61ef] shadow-lg shadow-indigo-900/30">
              <BookOpenCheck className="h-6 w-6 text-white" aria-hidden="true" />
            </span>
            <span className="text-2xl font-bold tracking-tight">
              Course<span className="text-[#7065ff]">Grid</span>
            </span>
            <span className="text-lg font-medium text-slate-400">LMS</span>
          </Link>

          <div className="mt-7">
            <span className="inline-flex rounded-lg bg-indigo-500/10 px-3 py-2 text-sm font-semibold text-[#8074ff]">
              Learn. Build. Grow.
            </span>
            <h1 className="mt-4 max-w-lg text-4xl font-bold leading-tight tracking-tight xl:text-[44px]">
              Your Learning Journey{" "}
              <span className="text-[#7466ff]">Starts Here</span>
            </h1>
            <p className="mt-3 max-w-md text-base leading-7 text-slate-300">
              CourseGrid LMS is a modern learning platform designed to help students,
              instructors, and organizations achieve more together.
            </p>
          </div>
        </div>

        <div className="relative z-10 mt-4 flex flex-1 items-center">
          <img
            src="/images/loginpage_image.png"
            alt="CourseGrid learning platform illustration"
            className="w-full max-w-[430px] object-contain drop-shadow-2xl"
          />
        </div>

        <div className="relative z-10 mt-2 grid grid-cols-3 gap-5">
          {featureCards.map((feature) => {
            const Icon = feature.icon;
            return (
              <div key={feature.title}>
                <div className="grid h-11 w-11 place-items-center rounded-lg bg-white/10 text-[#7466ff]">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </div>
                <h2 className="mt-3 text-sm font-bold text-white">{feature.title}</h2>
                <p className="mt-1.5 text-sm leading-5 text-slate-300">{feature.description}</p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="relative flex min-h-screen flex-col px-5 py-7 sm:px-8 lg:h-screen lg:min-h-0 lg:overflow-hidden lg:px-14">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(108,92,231,0.08),transparent_34%),linear-gradient(180deg,#fbfcff_0%,#f7f8ff_100%)]" />
        <div className="relative z-10 flex justify-end">
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-white"
            aria-label="Light mode selected"
          >
            <Sun className="h-5 w-5 text-slate-500" aria-hidden="true" />
            Light Mode
          </button>
        </div>

        <div className="relative z-10 flex flex-1 items-center justify-center py-4">
          <div className="w-full max-w-[545px] rounded-2xl border border-slate-200/80 bg-white/90 px-8 py-7 shadow-[0_22px_70px_rgba(31,41,79,0.12)] backdrop-blur sm:px-10 lg:px-11">
            <div className="text-center">
              <h2 className="text-2xl font-bold tracking-tight text-slate-950">Welcome back</h2>
              <p className="mt-3 text-base font-medium text-slate-500">
                Sign in to continue to CourseGrid LMS
              </p>
            </div>

            <form onSubmit={handleSubmit} className="mt-7 space-y-4">
              <div>
                <label className="text-sm font-bold text-slate-700" htmlFor="email">
                  Email address
                </label>
                <div className="mt-2.5 flex h-[50px] items-center rounded-lg border border-slate-200 bg-white px-4 shadow-sm focus-within:border-[#7065ff] focus-within:ring-4 focus-within:ring-indigo-100">
                  <Mail className="h-5 w-5 text-slate-400" aria-hidden="true" />
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    required
                    placeholder="Enter your email"
                    className="ml-3 min-w-0 flex-1 border-0 bg-transparent text-sm font-medium text-slate-900 outline-none placeholder:text-slate-400"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-bold text-slate-700" htmlFor="password">
                  Password
                </label>
                <div className="mt-2.5 flex h-[50px] items-center rounded-lg border border-slate-200 bg-white px-4 shadow-sm focus-within:border-[#7065ff] focus-within:ring-4 focus-within:ring-indigo-100">
                  <LockKeyhole className="h-5 w-5 text-slate-400" aria-hidden="true" />
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    required
                    placeholder="Enter your password"
                    className="ml-3 min-w-0 flex-1 border-0 bg-transparent text-sm font-medium text-slate-900 outline-none placeholder:text-slate-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((current) => !current)}
                    className="ml-3 rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
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
                <label className="inline-flex items-center gap-3 font-semibold text-slate-600">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(event) => setRememberMe(event.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-[#6558f5] focus:ring-[#6558f5]"
                  />
                  Remember me
                </label>
                <button
                  type="button"
                  className="font-semibold text-[#6558f5] hover:text-[#574de0]"
                >
                  Forgot password?
                </button>
              </div>

              {error ? (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                  {error}
                </div>
              ) : null}

              <button
                type="submit"
                disabled={isSubmitting}
                className="h-[50px] w-full rounded-lg bg-gradient-to-r from-[#6548e8] to-[#5b5cf5] text-sm font-bold text-white shadow-lg shadow-indigo-200 transition hover:from-[#5b40dd] hover:to-[#5153e8] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isSubmitting ? "Signing in..." : "Sign in"}
              </button>

              <div className="flex items-center gap-5 text-sm font-medium text-slate-400">
                <span className="h-px flex-1 bg-slate-200" />
                or
                <span className="h-px flex-1 bg-slate-200" />
              </div>

              <button
                type="button"
                className="flex h-[50px] w-full items-center justify-center gap-3 rounded-lg border border-slate-200 bg-white px-4 py-4 text-sm font-bold text-slate-800 shadow-sm hover:bg-slate-50"
              >
                <span className="text-lg font-black text-[#4285f4]">G</span>
                Sign in with Google
              </button>

              <p className="text-center text-sm font-semibold text-slate-500">
                Don't have an account?{" "}
                <Link className="text-[#6558f5] hover:text-[#574de0]" to="/register">
                  Create one
                </Link>
              </p>
            </form>
          </div>
        </div>

        <footer className="relative z-10 flex flex-col gap-3 text-center text-xs font-medium text-slate-400 sm:flex-row sm:items-center sm:justify-between lg:absolute lg:bottom-5 lg:left-14 lg:right-14">
          <p>(c) 2025 CourseGrid LMS. All rights reserved.</p>
          <div className="flex justify-center gap-8">
            <span>Privacy Policy</span>
            <span>Terms of Service</span>
          </div>
        </footer>
      </section>
    </main>
  );
}
