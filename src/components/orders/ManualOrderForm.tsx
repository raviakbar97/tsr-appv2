"use client";

import { useState } from "react";
import { X, Plus, Trash2, Loader2 } from "lucide-react";
import { createManualOrders } from "@/app/dashboard/orders/actions";
import Autocomplete from "@/components/ui/Autocomplete";
import { PROVINCES, CITIES_BY_PROVINCE } from "@/lib/data/indonesia-regions";

interface SKU {
  id: string;
  name: string;
  variations: { id: string; variation_name: string }[];
}

interface ItemRow {
  product_name: string;
  variation_name: string;
  parent_sku: string;
  discounted_price: number;
  quantity: number;
}

interface OrderGroup {
  order_number: string;
  order_status: string;
  created_at: string;
  payment_method: string;
  buyer_username: string;
  city: string;
  province: string;
  items: ItemRow[];
}

interface ManualOrderFormProps {
  skus: SKU[];
  onClose: () => void;
}

export default function ManualOrderForm({ skus, onClose }: ManualOrderFormProps) {
  const [orders, setOrders] = useState<OrderGroup[]>([
    {
      order_number: "",
      order_status: "Completed",
      created_at: new Date().toISOString().slice(0, 16),
      payment_method: "",
      buyer_username: "",
      city: "",
      province: "",
      items: [{ product_name: "", variation_name: "", parent_sku: "", discounted_price: 0, quantity: 1 }],
    },
  ]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function updateOrder(orderIdx: number, field: keyof OrderGroup, value: string) {
    const updated = [...orders];
    if (field === "items") return;
    (updated[orderIdx] as unknown as Record<string, unknown>)[field] = value;
    setOrders(updated);
  }

  function updateItem(orderIdx: number, itemIdx: number, field: keyof ItemRow, value: string | number) {
    const updated = [...orders];
    const items = [...updated[orderIdx].items];
    if (field === "discounted_price" || field === "quantity") {
      (items[itemIdx] as unknown as Record<string, unknown>)[field] = Number(value) || 0;
    } else {
      (items[itemIdx] as unknown as Record<string, unknown>)[field] = value;
    }
    // Auto-fill parent_sku from SKU name when selecting product
    if (field === "product_name") {
      const sku = skus.find((s) => s.name === value);
      if (sku && !items[itemIdx].parent_sku) {
        items[itemIdx].parent_sku = "MANUAL";
      }
    }
    updated[orderIdx] = { ...updated[orderIdx], items };
    setOrders(updated);
  }

  function addItemRow(orderIdx: number) {
    const updated = [...orders];
    updated[orderIdx] = {
      ...updated[orderIdx],
      items: [...updated[orderIdx].items, { product_name: "", variation_name: "", parent_sku: "", discounted_price: 0, quantity: 1 }],
    };
    setOrders(updated);
  }

  function removeItemRow(orderIdx: number, itemIdx: number) {
    const updated = [...orders];
    updated[orderIdx] = {
      ...updated[orderIdx],
      items: updated[orderIdx].items.filter((_, i) => i !== itemIdx),
    };
    setOrders(updated);
  }

  function addOrder() {
    setOrders([
      ...orders,
      {
        order_number: "",
        order_status: "Completed",
        created_at: new Date().toISOString().slice(0, 16),
        payment_method: "",
        buyer_username: "",
        city: "",
        province: "",
        items: [{ product_name: "", variation_name: "", parent_sku: "", discounted_price: 0, quantity: 1 }],
      },
    ]);
  }

  function removeOrder(orderIdx: number) {
    setOrders(orders.filter((_, i) => i !== orderIdx));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    // Validate
    for (const order of orders) {
      if (!order.order_number.trim()) {
        setError("All orders must have an order number");
        setLoading(false);
        return;
      }
      const validItems = order.items.filter((i) => i.product_name.trim());
      if (validItems.length === 0) {
        setError(`Order ${order.order_number} has no items`);
        setLoading(false);
        return;
      }
    }

    const payload = orders.map((o) => ({
      order_number: o.order_number.trim(),
      order_status: o.order_status,
      created_at: new Date(o.created_at).toISOString(),
      payment_method: o.payment_method || undefined,
      buyer_username: o.buyer_username || undefined,
      city: o.city || undefined,
      province: o.province || undefined,
      items: o.items
        .filter((i) => i.product_name.trim())
        .map((i) => ({
          product_name: i.product_name,
          variation_name: i.variation_name || undefined,
          parent_sku: i.parent_sku || "MANUAL",
          discounted_price: i.discounted_price,
          quantity: i.quantity,
        })),
    }));

    const result = await createManualOrders(payload);
    if (result.error) {
      setError(result.error);
      setLoading(false);
    } else {
      onClose();
    }
  }

  function getVariationsForSku(skuName: string) {
    const sku = skus.find((s) => s.name === skuName);
    return sku?.variations ?? [];
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-start justify-center z-50 overflow-y-auto py-8">
      <div className="bg-[var(--surface)] rounded-xl p-4 md:p-6 max-w-5xl w-[95vw] shadow-xl my-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-[var(--foreground)]">Manual Order Entry</h2>
          <button onClick={onClose} className="text-[var(--muted)] hover:text-[var(--foreground-secondary)]">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {orders.map((order, oIdx) => (
            <div key={oIdx} className="border border-[var(--border)] rounded-xl p-4">
              {/* Order header */}
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-[var(--foreground)]">Order {oIdx + 1}</span>
                {orders.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeOrder(oIdx)}
                    className="text-xs text-[var(--danger)] hover:text-[var(--danger)] flex items-center gap-1"
                  >
                    <Trash2 size={12} /> Remove Order
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
                <div>
                  <label className="block text-xs font-medium text-[var(--foreground-secondary)] mb-1">Order #</label>
                  <input
                    type="text"
                    value={order.order_number}
                    onChange={(e) => updateOrder(oIdx, "order_number", e.target.value)}
                    className="w-full border border-[var(--border-strong)] rounded-lg px-3 py-2 text-sm bg-[var(--surface)] text-[var(--foreground)] placeholder:text-[var(--muted)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                    placeholder="e.g. 250410ABC123"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[var(--foreground-secondary)] mb-1">Date</label>
                  <input
                    type="datetime-local"
                    value={order.created_at}
                    onChange={(e) => updateOrder(oIdx, "created_at", e.target.value)}
                    className="w-full border border-[var(--border-strong)] rounded-lg px-3 py-2 text-sm bg-[var(--surface)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] [color-scheme:light]"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[var(--foreground-secondary)] mb-1">Payment</label>
                  <input
                    type="text"
                    value={order.payment_method}
                    onChange={(e) => updateOrder(oIdx, "payment_method", e.target.value)}
                    className="w-full border border-[var(--border-strong)] rounded-lg px-3 py-2 text-sm bg-[var(--surface)] text-[var(--foreground)] placeholder:text-[var(--muted)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                    placeholder="e.g. ShopeePay"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[var(--foreground-secondary)] mb-1">Buyer</label>
                  <input
                    type="text"
                    value={order.buyer_username}
                    onChange={(e) => updateOrder(oIdx, "buyer_username", e.target.value)}
                    className="w-full border border-[var(--border-strong)] rounded-lg px-3 py-2 text-sm bg-[var(--surface)] text-[var(--foreground)] placeholder:text-[var(--muted)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                    placeholder="Username"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[var(--foreground-secondary)] mb-1">Province</label>
                  <Autocomplete
                    value={order.province}
                    onChange={(val) => {
                      updateOrder(oIdx, "province", val);
                      if (val !== order.province) updateOrder(oIdx, "city", "");
                    }}
                    suggestions={PROVINCES}
                    placeholder="Select province..."
                    className="w-full border border-[var(--border-strong)] rounded-lg px-3 py-2 text-sm bg-[var(--surface)] text-[var(--foreground)] placeholder:text-[var(--muted)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[var(--foreground-secondary)] mb-1">City</label>
                  <Autocomplete
                    value={order.city}
                    onChange={(val) => updateOrder(oIdx, "city", val)}
                    suggestions={order.province ? (CITIES_BY_PROVINCE[order.province] ?? []) : []}
                    placeholder={order.province ? "Select city..." : "Select province first"}
                    className="w-full border border-[var(--border-strong)] rounded-lg px-3 py-2 text-sm bg-[var(--surface)] text-[var(--foreground)] placeholder:text-[var(--muted)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] disabled:bg-[var(--surface-hover)] disabled:text-[var(--muted)]"
                  />
                </div>
              </div>

              {/* Items table matching order listing columns */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-[var(--surface-hover)]">
                    <tr>
                      <th className="text-left px-3 py-2 font-medium text-[var(--foreground-secondary)] text-xs">Product</th>
                      <th className="text-left px-3 py-2 font-medium text-[var(--foreground-secondary)] text-xs">Variation</th>
                      <th className="text-right px-3 py-2 font-medium text-[var(--foreground-secondary)] text-xs">Selling Price</th>
                      <th className="text-right px-3 py-2 font-medium text-[var(--foreground-secondary)] text-xs">Qty</th>
                      <th className="text-right px-3 py-2 font-medium text-[var(--foreground-secondary)] text-xs">Total</th>
                      <th className="w-10 px-2"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {order.items.map((item, iIdx) => {
                      const variations = getVariationsForSku(item.product_name);
                      return (
                        <tr key={iIdx} className="border-t border-[var(--border)]">
                          <td className="px-3 py-2">
                            <select
                              value={item.product_name}
                              onChange={(e) => {
                                updateItem(oIdx, iIdx, "product_name", e.target.value);
                                // Reset variation when product changes
                                updateItem(oIdx, iIdx, "variation_name", "");
                              }}
                              className="w-full border border-[var(--border-strong)] rounded-lg px-2 py-1.5 text-sm bg-[var(--surface)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                              required
                            >
                              <option value="">Select product...</option>
                              {skus.map((sku) => (
                                <option key={sku.id} value={sku.name}>
                                  {sku.name}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="px-3 py-2">
                            {variations.length > 0 ? (
                              <select
                                value={item.variation_name}
                                onChange={(e) => updateItem(oIdx, iIdx, "variation_name", e.target.value)}
                                className="w-full border border-[var(--border-strong)] rounded-lg px-2 py-1.5 text-sm bg-[var(--surface)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                              >
                                <option value="">None</option>
                                {variations.map((v) => (
                                  <option key={v.id} value={v.variation_name}>
                                    {v.variation_name}
                                  </option>
                                ))}
                              </select>
                            ) : (
                              <input
                                type="text"
                                value={item.variation_name}
                                onChange={(e) => updateItem(oIdx, iIdx, "variation_name", e.target.value)}
                                className="w-full border border-[var(--border-strong)] rounded-lg px-2 py-1.5 text-sm bg-[var(--surface)] text-[var(--foreground)] placeholder:text-[var(--muted)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                                placeholder="Optional"
                              />
                            )}
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="text"
                              inputMode="numeric"
                              value={item.discounted_price || ""}
                              onChange={(e) => updateItem(oIdx, iIdx, "discounted_price", e.target.value.replace(/[^\d]/g, ""))}
                              className="w-28 text-right border border-[var(--border-strong)] rounded-lg px-2 py-1.5 text-sm bg-[var(--surface)] text-[var(--foreground)] placeholder:text-[var(--muted)] font-mono focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                              placeholder="0"
                              required
                            />
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="number"
                              value={item.quantity || ""}
                              onChange={(e) => updateItem(oIdx, iIdx, "quantity", e.target.value)}
                              className="w-16 text-center border border-[var(--border-strong)] rounded-lg px-2 py-1.5 text-sm bg-[var(--surface)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                              min="1"
                              required
                            />
                          </td>
                          <td className="px-3 py-2 text-right font-mono text-[var(--foreground)] whitespace-nowrap">
                            {formatIDR(item.discounted_price * item.quantity)}
                          </td>
                          <td className="px-2 py-2">
                            {order.items.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeItemRow(oIdx, iIdx)}
                                className="p-1 text-[var(--muted)] hover:text-[var(--danger)]"
                              >
                                <Trash2 size={14} />
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="border-t border-[var(--border)]">
                      <td colSpan={4} className="px-3 py-2 text-right text-xs font-medium text-[var(--foreground-secondary)]">
                        Total
                      </td>
                      <td className="px-3 py-2 text-right font-mono text-sm font-semibold text-[var(--foreground)]">
                        {formatIDR(order.items.reduce((s, i) => s + i.discounted_price * i.quantity, 0))}
                      </td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              <button
                type="button"
                onClick={() => addItemRow(oIdx)}
                className="mt-2 text-xs text-[var(--primary)] hover:text-[var(--primary)] flex items-center gap-1"
              >
                <Plus size={14} /> Add Item
              </button>
            </div>
          ))}

          <button
            type="button"
            onClick={addOrder}
            className="w-full py-2 border-2 border-dashed border-[var(--border-strong)] rounded-xl text-sm text-[var(--foreground-secondary)] hover:text-[var(--primary)] hover:border-[var(--primary)] transition-colors flex items-center justify-center gap-1"
          >
            <Plus size={14} /> Add Another Order
          </button>

          {error && <p className="text-sm text-[var(--danger)]">{error}</p>}

          <div className="flex gap-3 justify-end pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-[var(--foreground-secondary)] bg-[var(--surface-hover)] rounded-lg hover:bg-[var(--border)]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-[var(--primary)] rounded-lg hover:bg-[var(--primary-hover)] disabled:opacity-50 flex items-center gap-2"
            >
              {loading && <Loader2 size={14} className="animate-spin" />}
              {loading ? "Saving..." : `Save ${orders.length} Order${orders.length > 1 ? "s" : ""}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function formatIDR(n: number): string {
  return "Rp " + Number(n).toLocaleString("id-ID");
}
