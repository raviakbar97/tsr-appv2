interface PageHeaderProps {
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
}

export default function PageHeader({ title, subtitle, children }: PageHeaderProps) {
  return (
    <div className={`mb-6 ${children ? "flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3" : ""}`}>
      <div>
        <h1 className="text-2xl font-bold text-[var(--foreground)]">{title}</h1>
        {subtitle && (
          <p className="text-sm text-[var(--foreground-secondary)] mt-1">{subtitle}</p>
        )}
      </div>
      {children}
    </div>
  );
}
