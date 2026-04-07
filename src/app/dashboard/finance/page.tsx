import { DollarSign } from "lucide-react";
import PageHeader from "@/components/PageHeader";

export default function FinancePage() {
  return (
    <div>
      <PageHeader title="Finance" subtitle="Accounting, income statements, and financial reports" />

      <div className="bg-[var(--surface)] rounded-xl border border-[var(--border)] p-12 text-center shadow-[var(--shadow-sm)]">
        <DollarSign size={48} className="mx-auto text-[var(--muted)] mb-4" />
        <h2 className="text-lg font-medium text-[var(--foreground)] mb-2">
          No financial data yet
        </h2>
        <p className="text-sm text-[var(--muted)]">
          Import your Shopee CSV to see financial summaries.
        </p>
      </div>
    </div>
  );
}
