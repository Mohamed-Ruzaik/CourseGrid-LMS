type MessageBoxProps = {
  tone?: "error" | "success" | "info";
  children: React.ReactNode;
};

const toneClasses = {
  error: "border-red-200 bg-red-50 text-red-700",
  success: "border-emerald-200 bg-emerald-50 text-emerald-700",
  info: "border-slate-200 bg-white text-slate-600"
};

export function MessageBox({ tone = "info", children }: MessageBoxProps) {
  return (
    <div className={`rounded-md border px-3 py-2 text-sm ${toneClasses[tone]}`}>
      {children}
    </div>
  );
}
