type PageHeaderProps = {
  title: string;
  description: string;
};

export function PageHeader({ title, description }: PageHeaderProps) {
  return (
    <div className="border-b border-slate-200 bg-white px-6 py-4">
      <p className="max-w-3xl text-sm leading-6 text-slate-600" aria-label={title}>
        {description}
      </p>
    </div>
  );
}
