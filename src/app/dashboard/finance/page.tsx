import { DollarSign } from "lucide-react";

export default function FinancePage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Finance</h1>
        <p className="text-sm text-gray-500 mt-1">
          Accounting, income statements, and financial reports
        </p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
        <DollarSign size={48} className="mx-auto text-gray-300 mb-4" />
        <h2 className="text-lg font-medium text-gray-900 mb-2">
          No financial data yet
        </h2>
        <p className="text-sm text-gray-500">
          Import your Shopee CSV to see financial summaries.
        </p>
      </div>
    </div>
  );
}
