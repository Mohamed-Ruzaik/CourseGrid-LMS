import { ReactNode, useEffect } from "react";

type AuthShellProps = {
  children: ReactNode;
  title: string;
  subtitle: string;
  documentTitle: string;
};

function CourseGridMark() {
  return (
    <div className="grid h-9 w-9 grid-cols-2 gap-1 rounded-lg" aria-hidden="true">
      <span className="rounded-md bg-blue-600" />
      <span className="rounded-md bg-blue-600" />
      <span className="rounded-md bg-blue-600" />
      <span className="rounded-md bg-blue-600" />
    </div>
  );
}

export function AuthShell({ children, documentTitle, subtitle, title }: AuthShellProps) {
  useEffect(() => {
    document.title = documentTitle;
    document.documentElement.classList.remove("dark");
  }, [documentTitle]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[#f8fafc] px-4 py-10 text-slate-950">
      <section className="w-full max-w-[590px] rounded-xl border border-slate-200 bg-white px-10 py-12 shadow-[0_22px_80px_rgba(15,23,42,0.08)] sm:px-16">
        <div className="mb-9 text-center">
          <div className="mb-8 flex items-center justify-center gap-4">
            <CourseGridMark />
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold tracking-tight">
                Course<span className="text-blue-600">Grid</span>
              </span>
              <span className="text-base font-medium text-slate-500">LMS</span>
            </div>
          </div>

          <h1 className="text-4xl font-bold tracking-tight text-slate-950">{title}</h1>
          <p className="mt-4 text-base font-medium text-slate-500">{subtitle}</p>
        </div>

        {children}
      </section>

      <p className="mt-7 max-w-md text-center text-sm leading-7 text-slate-500">
        By signing in, you agree to our{" "}
        <span className="font-semibold text-blue-600">Terms of Service</span>
        <br />
        and <span className="font-semibold text-blue-600">Privacy Policy</span>.
      </p>
    </main>
  );
}
