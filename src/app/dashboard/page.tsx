import {
  ShoppingCart,
  Package,
  DollarSign,
  TrendingUp,
} from "lucide-react";

export default function DashboardPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">
          Overview of your business
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-50 rounded-lg">
              <ShoppingCart size={20} className="text-blue-600" />
            </div>
            <span className="text-sm font-medium text-gray-500">
              Total Orders
            </span>
          </div>
          <p className="text-3xl font-bold text-gray-900">—</p>
          <p className="text-xs text-gray-400 mt-1">Import CSV to see data</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-green-50 rounded-lg">
              <Package size={20} className="text-green-600" />
            </div>
            <span className="text-sm font-medium text-gray-500">
              Products
            </span>
          </div>
          <p className="text-3xl font-bold text-gray-900">—</p>
          <p className="text-xs text-gray-400 mt-1">Import CSV to see data</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-yellow-50 rounded-lg">
              <DollarSign size={20} className="text-yellow-600" />
            </div>
            <span className="text-sm font-medium text-gray-500">Revenue</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">—</p>
          <p className="text-xs text-gray-400 mt-1">Import CSV to see data</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-purple-50 rounded-lg">
              <TrendingUp size={20} className="text-purple-600" />
            </div>
            <span className="text-sm font-medium text-gray-500">Profit</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">—</p>
          <p className="text-xs text-gray-400 mt-1">Import CSV to see data</p>
        </div>
      </div>

      <div className="mt-8 bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">
          Getting Started
        </h2>
        <p className="text-sm text-gray-500">
          Go to <strong>Import CSV</strong> to upload your Shopee sales data.
          Your orders, inventory, and financial data will be automatically
          populated.
        </p>
      </div>
    </div>
  );
}
