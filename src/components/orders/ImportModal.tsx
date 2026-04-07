"use client";

import { useState } from "react";
import { X } from "lucide-react";
import UploadZone from "@/components/import/UploadZone";
import ImportPreview from "@/components/import/ImportPreview";

interface ImportModalProps {
  onClose: () => void;
}

type ParseResult = {
  orderCount: number;
  itemCount: number;
  skippedCount: number;
  orders: { order_number: string; order_status: string; total_payment: number; created_at: string; buyer_username: string | null; city: string | null }[];
  items: { order_number: string; parent_sku: string; product_name: string; variation_name: string | null; quantity: number; buyer_paid: number }[];
};

export default function ImportModal({ onClose }: ImportModalProps) {
  const [parsed, setParsed] = useState<ParseResult | null>(null);

  function handleParsed(result: ParseResult) {
    setParsed(result);
  }

  function handleDone() {
    setParsed(null);
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-start justify-center z-50 overflow-y-auto py-8">
      <div className="bg-[var(--surface)] rounded-xl p-4 md:p-6 max-w-4xl w-[95vw] shadow-xl my-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-[var(--foreground)]">Import XLSX</h2>
          <button onClick={onClose} className="text-[var(--muted)] hover:text-[var(--foreground-secondary)]">
            <X size={20} />
          </button>
        </div>

        {parsed ? (
          <ImportPreview
            orderCount={parsed.orderCount}
            itemCount={parsed.itemCount}
            skippedCount={parsed.skippedCount}
            orders={parsed.orders}
            items={parsed.items}
            onDone={handleDone}
          />
        ) : (
          <UploadZone onParsed={handleParsed} />
        )}
      </div>
    </div>
  );
}
