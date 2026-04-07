"use client";

import { useState } from "react";
import { X, Plus, Trash2, Loader2 } from "lucide-react";
import { updateOrder } from "@/app/dashboard/orders/actions";

interface OrderItem {
  product_name: string;
  variation_name: string;
  parent_sku: string;
  discounted_price: number;
  quantity: number;
}

interface OrderData {
  id: string;
  order_number: string;
  payment_method: string;
  buyer_username: string;
  city: string;
  province: string;
  items: OrderItem[];
}

interface SKU {
  id: string;
  name: string;
  variations: { id: string; variation_name: string }[];
}

interface Props {
  order: OrderData;
  skus: SKU[];
  onClose: () => void;
}

export default function OrderEditModal({ order, skus, onClose }: Props) {
  const [orderNumber, setOrderNumber] = useState(order.order_number);
  const [payment, setPayment] = useState(order.payment_method);
  const [buyer, setBuyer] = useState(order.buyer_username);
  const [city, setCity] = useState(order.city);
  const [province, setProvince] = useState(order.province);
  const [items, setItems] = useState<OrderItem[]>(order.items);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function updateItem(idx: number, field: keyof OrderItem, value: string | number) {
    const updated = [...items];
    if (field === "discounted_price" || field === "quantity") {
      (updated[idx] as unknown as Record<string, unknown>)[field] = Number(value) || 0;
    } else {
      (updated[idx] as unknown as Record<string, unknown>)[field] = value;
    }
    setItems(updated);
  }

  function addItem() {
    setItems([...items, { product_name: "", variation_name: "", parent_sku: "MANUAL", discounted_price: 0, quantity: 1 }]);
  }

  function removeItem(idx: number) {
    setItems(items.filter((_, i) => i !== idx));
  }

  function getVariations(productName: string) {
    const sku = skus.find((s) => s.name === productName);
    return sku?.variations ?? [];
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const validItems = items.filter((i) => i.product_name.trim());
    if (validItems.length === 0) {
      setError("At least one item is required");
      setLoading(false);
      return;
    }

    const result = await updateOrder(order.id, {
      order_number: orderNumber.trim(),
      payment_method: payment,
      buyer_username: buyer,
      city,
      province,
      items: validItems,
    });

    if (result.error) {
      setError(result.error);
      setLoading(false);
    } else {
      onClose();
    }
  }

  const inputCls = "w-full border border-[var(--border-strong)] rounded-lg px-3 py-2 text-sm bg-[var(--surface)] text-[var(--foreground)] placeholder:text-[var(--muted)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]";

  return (
    <div className="fixed inset-0 bg-black/50 flex items-start justify-center z-50 overflow-y-auto py-8">
      <div className="bg-[var(--surface)] rounded-xl p-4 md:p-6 max-w-3xl w-[95vw] shadow-xl my-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-[var(--foreground)]">Edit Order</h2>
          <button onClick={onClose} className="text-[var(--muted)] hover:text-[var(--foreground-secondary)]"><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Order metadata */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-[var(--foreground-secondary)] mb-1">Order #</label>
              <input type="text" value={orderNumber} onChange={(e) => setOrderNumber(e.target.value)} className={inputCls} required />
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--foreground-secondary)] mb-1">Payment</label>
              <input type="text" value={payment} onChange={(e) => setPayment(e.target.value)} className={inputCls} placeholder="e.g. ShopeePay" />
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--foreground-secondary)] mb-1">Buyer</label>
              <input type="text" value={buyer} onChange={(e) => setBuyer(e.target.value)} className={inputCls} placeholder="Username" />
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--foreground-secondary)] mb-1">City</label>
              <input type="text" value={city} onChange={(e) => setCity(e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--foreground-secondary)] mb-1">Province</label>
              <input type="text" value={province} onChange={(e) => setProvince(e.target.value)} className={inputCls} />
            </div>
          </div>

          {/* Items table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[var(--surface-hover)]">
                <tr>
                  <th className="text-left px-3 py-2 font-medium text-[var(--foreground-secondary)] text-xs">Product</th>
                  <th className="text-left px-3 py-2 font-medium text-[var(--foreground-secondary)] text-xs">Variation</th>
                  <th className="text-right px-3 py-2 font-medium text-[var(--foreground-secondary)] text-xs">Price</th>
                  <th className="text-right px-3 py-2 font-medium text-[var(--foreground-secondary)] text-xs">Qty</th>
                  <th className="w-10 px-2"></th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, idx) => {
                  const variations = getVariations(item.product_name);
                  return (
                    <tr key={idx} className="border-t border-[var(--border)]">
                      <td className="px-3 py-2">
                        <select
                          value={item.product_name}
                          onChange={(e) => { updateItem(idx, "product_name", e.target.value); updateItem(idx, "variation_name", ""); }}
                          className={`w-full ${inputCls} px-2 py-1.5`}
                          required
                        >
                          <option value="">Select...</option>
                          {skus.map((s) => <option key={s.id} value={s.name}>{s.name}</option>)}
                        </select>
                      </td>
                      <td className="px-3 py-2">
                        {variations.length > 0 ? (
                          <select value={item.variation_name} onChange={(e) => updateItem(idx, "variation_name", e.target.value)} className={`w-full ${inputCls} px-2 py-1.5`}>
                            <option value="">None</option>
                            {variations.map((v) => <option key={v.id} value={v.variation_name}>{v.variation_name}</option>)}
                          </select>
                        ) : (
                          <input type="text" value={item.variation_name} onChange={(e) => updateItem(idx, "variation_name", e.target.value)} className={`w-full ${inputCls} px-2 py-1.5`} placeholder="Optional" />
                        )}
                      </td>
                      <td className="px-3 py-2">
                        <input type="text" inputMode="numeric" value={item.discounted_price || ""} onChange={(e) => updateItem(idx, "discounted_price", e.target.value.replace(/[^\d]/g, ""))} className={`w-24 text-right ${inputCls} px-2 py-1.5 font-mono`} placeholder="0" required />
                      </td>
                      <td className="px-3 py-2">
                        <input type="number" value={item.quantity || ""} onChange={(e) => updateItem(idx, "quantity", e.target.value)} className={`w-16 text-center ${inputCls} px-2 py-1.5`} min="1" required />
                      </td>
                      <td className="px-2 py-2">
                        {items.length > 1 && (
                          <button type="button" onClick={() => removeItem(idx)} className="p-1 text-[var(--muted)] hover:text-[var(--danger)]"><Trash2 size={14} /></button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <button type="button" onClick={addItem} className="text-xs text-[var(--primary)] hover:text-[var(--primary-hover)] flex items-center gap-1">
            <Plus size={14} /> Add Item
          </button>

          {error && <p className="text-sm text-[var(--danger)]">{error}</p>}

          <div className="flex gap-3 justify-end pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-[var(--foreground-secondary)] bg-[var(--surface-hover)] rounded-lg hover:bg-[var(--border)]">Cancel</button>
            <button type="submit" disabled={loading} className="px-4 py-2 text-sm font-medium text-white bg-[var(--primary)] rounded-lg hover:bg-[var(--primary-hover)] disabled:opacity-50 flex items-center gap-2">
              {loading && <Loader2 size={14} className="animate-spin" />}
              {loading ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
