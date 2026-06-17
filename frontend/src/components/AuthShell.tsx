import { ReactNode, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Moon, Sun, UserCircle } from "lucide-react";

type AuthShellProps = {
  children: ReactNode;
  eyebrow: string;
  title: string;
  subtitle: string;
  documentTitle: string;
};

function CourseGridLogo({ className = "h-10 w-10" }: { className?: string }) {
  return (
    <svg
      className={`${className} transition-transform duration-300 hover:scale-105`}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="coursegrid-auth-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#3b82f6" />
          <stop offset="60%" stopColor="#6366f1" />
          <stop offset="100%" stopColor="#a855f7" />
        </linearGradient>
      </defs>

      <path
        d="M24 9H15C11.13 9 8 12.13 8 16C8 19.87 11.13 23 15 23H24"
        stroke="url(#coursegrid-auth-grad)"
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="21" cy="16" r="3.2" fill="url(#coursegrid-auth-grad)" />
    </svg>
  );
}

export function AuthShell({ children, documentTitle, eyebrow, subtitle, title }: AuthShellProps) {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    document.title = documentTitle;
    document.documentElement.classList.toggle("dark", isDark);
  }, [documentTitle, isDark]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100/70 p-4 text-slate-800 transition-colors duration-300 dark:bg-slate-950 dark:text-slate-200 sm:p-8">
      <button
        type="button"
        onClick={() => setIsDark((current) => !current)}
        className="absolute right-6 top-6 z-50 grid h-11 w-11 place-items-center rounded-full border border-slate-200/80 bg-white text-slate-500 shadow-sm transition hover:shadow-md dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
        aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      >
        {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
      </button>

      <section className="grid w-full max-w-5xl overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-[0_25px_60px_-15px_rgba(0,0,0,0.08)] transition-colors duration-300 dark:border-slate-800/80 dark:bg-slate-900 md:grid-cols-[40%_60%]">
        <aside className="relative hidden overflow-hidden border-r border-slate-200/10 bg-slate-900 p-12 text-white transition-colors duration-300 dark:bg-slate-950 dark:border-slate-800 md:flex md:flex-col md:justify-between">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-30 [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />

          <div className="relative z-10 my-auto">
            <Link to="/login" className="mb-16 flex items-center gap-3">
              <CourseGridLogo className="h-9 w-9" />
              <span className="text-xl font-bold tracking-tight">
                <span className="text-white">Course</span>
                <span className="text-indigo-400">Grid</span>
                <span className="ml-1.5 text-sm font-normal uppercase tracking-wider text-slate-500">
                  LMS
                </span>
              </span>
            </Link>

            <h1 className="mb-4 text-4xl font-bold leading-tight tracking-tight">
              Unlock Your <br />
              Potential.
            </h1>
            <p className="max-w-xs text-sm font-medium leading-relaxed text-slate-400">
              Access your courses, manage assignments, and track your academic progress all in one
              secure platform.
            </p>
          </div>
        </aside>

        <section className="relative z-10 flex w-full flex-col items-center justify-center bg-slate-50/50 p-6 transition-colors duration-300 dark:bg-slate-900/40 sm:p-12 lg:p-16">
          <header className="mb-8 flex w-full max-w-md items-center gap-3 md:hidden">
            <CourseGridLogo className="h-9 w-9" />
            <span className="text-xl font-bold tracking-tight">
              <span className="text-slate-800 dark:text-white">Course</span>
              <span className="text-indigo-500">Grid</span>
              <span className="ml-1 text-sm font-normal uppercase text-slate-400 dark:text-slate-500">
                LMS
              </span>
            </span>
          </header>

          <div className="w-full max-w-md rounded-3xl border border-slate-200/60 bg-white p-8 shadow-[0_15px_35px_-5px_rgba(0,0,0,0.05)] transition-colors duration-300 dark:border-slate-800 dark:bg-slate-950 sm:p-10">
            <div className="mb-8 flex flex-col items-center text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-slate-100 bg-slate-50 text-slate-400 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-500">
                <UserCircle className="h-8 w-8" />
              </div>
              <p className="mb-2 text-xs font-bold uppercase tracking-[0.22em] text-indigo-500">
                {eyebrow}
              </p>
              <h2 className="mb-2 text-2xl font-bold text-slate-800 dark:text-white">{title}</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>
            </div>

            {children}
          </div>
        </section>
      </section>
    </main>
  );
}
