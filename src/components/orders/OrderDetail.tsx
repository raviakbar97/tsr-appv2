"use client";

import { Link2 } from "lucide-react";

interface OrderItem {
  id: string;
  sku_id: string | null;
  variation_id: string | null;
  parent_sku: string;
  product_name: string;
  sku_reference: string | null;
  variation_name: string | null;
  original_price: number;
  discounted_price: number;
  quantity: number;
  buyer_paid: number;
  total_discount: number;
  seller_discount: number;
  shopee_discount: number;
  product_weight: string | null;
}

interface Order {
  tracking_number: string | null;
  shipping_option: string | null;
  payment_method: string | null;
  buyer_shipping_cost: number;
  province: string | null;
}

interface OrderDetailProps {
  order: Order;
  items: OrderItem[];
}

export default function OrderDetail({ order, items }: OrderDetailProps) {
  return (
    <div className="space-y-3 text-[var(--foreground)]">
      <div className="grid grid-cols-3 gap-4 text-xs">
        {order.tracking_number && (
          <div>
            <span className="text-gray-800 font-medium">No. Resi</span>
            <p className="font-mono font-medium">{order.tracking_number}</p>
          </div>
        )}
        {order.shipping_option && (
          <div>
            <span className="text-gray-800 font-medium">Shipping</span>
            <p className="font-medium">{order.shipping_option}</p>
          </div>
        )}
        {order.payment_method && (
          <div>
            <span className="text-gray-800 font-medium">Payment</span>
            <p className="font-medium">{order.payment_method}</p>
          </div>
        )}
      </div>

      <table className="w-full text-xs">
        <thead>
          <tr className="text-gray-800">
            <th className="text-left pb-2 font-medium">Product</th>
            <th className="text-left pb-2 font-medium">SKU</th>
            <th className="text-left pb-2 font-medium">Variasi</th>
            <th className="text-right pb-2 font-medium">Price</th>
            <th className="text-right pb-2 font-medium">Disc</th>
            <th className="text-center pb-2 font-medium">Qty</th>
            <th className="text-right pb-2 font-medium">Paid</th>
            <th className="text-center pb-2 font-medium">Linked</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id} className="border-t border-[var(--border)]">
              <td className="py-2 pr-2 text-[var(--foreground)] max-w-[200px] truncate">{item.product_name}</td>
              <td className="py-2 pr-2 font-mono">{item.parent_sku}</td>
              <td className="py-2 pr-2">{item.variation_name || "-"}</td>
              <td className="py-2 pr-2 text-right font-mono">{formatIDR(item.discounted_price)}</td>
              <td className="py-2 pr-2 text-right font-mono text-[var(--danger)]">
                {item.total_discount > 0 ? `-${formatIDR(item.total_discount)}` : "-"}
              </td>
              <td className="py-2 text-center">{item.quantity}</td>
              <td className="py-2 text-right font-mono font-medium">{formatIDR(item.buyer_paid)}</td>
              <td className="py-2 text-center">
                {item.sku_id ? (
                  <span className="inline-flex items-center gap-1 text-green-600">
                    <Link2 size={12} /> SKU
                  </span>
                ) : (
                  <span className="text-gray-800">-</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function formatIDR(n: number): string {
  return "Rp " + Number(n).toLocaleString("id-ID");
}
