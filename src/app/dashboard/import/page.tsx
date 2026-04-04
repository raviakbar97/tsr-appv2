import { Upload } from "lucide-react";

export default function ImportPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Import CSV</h1>
        <p className="text-sm text-gray-500 mt-1">
          Upload your Shopee sales export
        </p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
        <Upload size={48} className="mx-auto text-gray-300 mb-4" />
        <h2 className="text-lg font-medium text-gray-900 mb-2">
          CSV Import coming soon
        </h2>
        <p className="text-sm text-gray-500">
          This feature will be built in Phase 2.
        </p>
      </div>
    </div>
  );
}
