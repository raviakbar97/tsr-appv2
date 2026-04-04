"use client";

import { useState } from "react";
import UploadZone from "@/components/import/UploadZone";
import ImportPreview from "@/components/import/ImportPreview";

interface PreviewData {
  orderCount: number;
  itemCount: number;
  skippedCount: number;
  orders: { order_number: string; order_status: string; total_payment: number; created_at: string; buyer_username: string | null; city: string | null }[];
  items: { order_number: string; parent_sku: string; product_name: string; variation_name: string | null; quantity: number; buyer_paid: number }[];
}

export default function ImportPage() {
  const [preview, setPreview] = useState<PreviewData | null>(null);

  function handleDone() {
    setPreview(null);
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Import Orders</h1>
        <p className="text-sm text-gray-600 mt-1">
          Upload your Shopee order export (.xlsx)
        </p>
      </div>

      {preview ? (
        <ImportPreview
          orderCount={preview.orderCount}
          itemCount={preview.itemCount}
          skippedCount={preview.skippedCount ?? 0}
          orders={preview.orders}
          items={preview.items}
          onDone={handleDone}
        />
      ) : (
        <div className="max-w-xl">
          <UploadZone onParsed={setPreview} />
        </div>
      )}
    </div>
  );
}
