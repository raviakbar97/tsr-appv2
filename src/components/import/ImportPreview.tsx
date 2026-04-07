"use client";

import { useState } from "react";
import { CheckCircle, AlertCircle, Loader2 } from "lucide-react";

interface ImportPreviewProps {
  orderCount: number;
  itemCount: number;
  skippedCount: number;
  orders: { order_number: string; order_status: string; total_payment: number; created_at: string; buyer_username: string | null; city: string | null }[];
  items: { order_number: string; parent_sku: string; product_name: string; variation_name: string | null; quantity: number; buyer_paid: number }[];
  onDone: () => void;
}

export default function ImportPreview({ orderCount, itemCount, skippedCount, orders, items, onDone }: ImportPreviewProps) {
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{ success: boolean; orderCount: number; itemCount: number; skippedDuplicates: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleConfirm() {
    setImporting(true);
    setError(null);

    try {
      const res = await fetch("/api/import/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orders, items }),
      });
      const data = await res.json();

      if (data.error) {
        setError(data.error);
      } else {
        setResult(data);
      }
    } catch {
      setError("Import failed");
    } finally {
      setImporting(false);
    }
  }

  if (result) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-xl p-8 text-center">
        <CheckCircle size={48} className="mx-auto text-green-500 mb-4" />
        <h3 className="text-lg font-medium text-green-900 mb-2">Import Successful</h3>
        <div className="text-sm text-green-700 space-y-1">
          <p>{result.orderCount} orders and {result.itemCount} items imported</p>
          {result.skippedDuplicates > 0 && (
            <p>{result.skippedDuplicates} existing orders skipped (duplicates)</p>
          )}
        </div>
        <button
          onClick={onDone}
          className="mt-4 px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700"
        >
          Import More
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-medium text-[var(--foreground)]">Preview</h3>
          <p className="text-sm text-[var(--foreground-secondary)]">
            {orderCount} orders, {itemCount} items found
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onDone}
            className="px-4 py-2 border border-[var(--border-strong)] rounded-lg text-sm text-[var(--foreground-secondary)] hover:bg-[var(--surface-hover)]"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={importing || orderCount === 0}
            className="px-4 py-2 bg-[var(--primary)] text-white rounded-lg text-sm hover:bg-[var(--primary-hover)] disabled:opacity-50 flex items-center gap-2"
          >
            {importing && <Loader2 size={14} className="animate-spin" />}
            {importing ? "Importing..." : "Confirm Import"}
          </button>
        </div>
      </div>

      {skippedCount > 0 && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800 flex items-center gap-2">
          <AlertCircle size={14} />
          {skippedCount} order(s) skipped (unpaid/cancelled)
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex items-center gap-2">
          <AlertCircle size={14} />
          {error}
        </div>
      )}

      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl overflow-hidden">
        <table className="w-full text-sm text-[var(--foreground)]">
          <thead className="bg-[var(--surface-hover)]">
            <tr>
              <th className="text-left px-4 py-3 font-medium">Order #</th>
              <th className="text-left px-4 py-3 font-medium">Status</th>
              <th className="text-left px-4 py-3 font-medium">Buyer</th>
              <th className="text-left px-4 py-3 font-medium">City</th>
              <th className="text-right px-4 py-3 font-medium">Total</th>
              <th className="text-left px-4 py-3 font-medium">Date</th>
              <th className="text-center px-4 py-3 font-medium">Items</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => {
              const orderItems = items.filter((i) => i.order_number === order.order_number);
              return (
                <tr key={order.order_number} className="border-t border-gray-100">
                  <td className="px-4 py-3 font-mono text-xs">{order.order_number}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.order_status)}`}>
                      {order.order_status}
                    </span>
                  </td>
                  <td className="px-4 py-3">{order.buyer_username || "-"}</td>
                  <td className="px-4 py-3">{order.city || "-"}</td>
                  <td className="px-4 py-3 text-right font-mono">{formatIDR(order.total_payment)}</td>
                  <td className="px-4 py-3">{formatDate(order.created_at)}</td>
                  <td className="px-4 py-3 text-center">{orderItems.length}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function formatIDR(n: number): string {
  return "Rp " + n.toLocaleString("id-ID");
}

function formatDate(iso: string): string {
  if (!iso) return "-";
  const d = new Date(iso);
  return d.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
}

function getStatusColor(status: string): string {
  if (status.includes("Selesai")) return "bg-green-100 text-green-800";
  if (status.includes("Dikirim") || status.includes("Proses")) return "bg-blue-100 text-blue-800";
  if (status.includes("Batal")) return "bg-red-100 text-red-800";
  return "bg-yellow-100 text-yellow-800";
}
