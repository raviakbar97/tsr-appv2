import type { RawOrderRow } from "./parser";

export interface OrderInsert {
  order_number: string;
  order_status: string;
  tracking_number: string | null;
  shipping_option: string | null;
  payment_method: string | null;
  buyer_username: string | null;
  city: string | null;
  province: string | null;
  buyer_note: string | null;
  cancellation_reason: string | null;
  total_payment: number;
  buyer_shipping_cost: number;
  estimated_shipping_cost: number;
  estimated_shipping: number;
  created_at: string;
  paid_at: string | null;
  completed_at: string | null;
}

export interface OrderItemInsert {
  order_number: string;
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

export interface ParsedImport {
  orders: Map<string, OrderInsert>;
  items: OrderItemInsert[];
  skippedCount: number;
}

/** Statuses to skip during import */
const SKIPPED_STATUSES = ["belum bayar", "batal"];

/** Group raw rows by order_number, separating order-level vs item-level data.
 *  Rows with "Belum Dibayar" or "Dibatalkan" status are excluded. */
export function mapRowsToOrders(rows: RawOrderRow[]): ParsedImport {
  const orders = new Map<string, OrderInsert>();
  const items: OrderItemInsert[] = [];
  const skippedStatuses: string[] = [];

  for (const row of rows) {
    if (!row.orderNumber) continue;

    // Skip unpaid and cancelled orders
    const statusLower = row.orderStatus.toLowerCase();
    if (SKIPPED_STATUSES.some(s => statusLower.includes(s))) {
      skippedStatuses.push(row.orderNumber);
      continue;
    }

    // Only create order entry once per order_number
    if (!orders.has(row.orderNumber)) {
      orders.set(row.orderNumber, {
        order_number: row.orderNumber,
        order_status: row.orderStatus,
        tracking_number: row.trackingNumber || null,
        shipping_option: row.shippingOption || null,
        payment_method: row.paymentMethod || null,
        buyer_username: row.buyerUsername || null,
        city: row.city || null,
        province: row.province || null,
        buyer_note: row.buyerNote || null,
        cancellation_reason: row.cancellationReason || null,
        total_payment: row.totalPayment,
        buyer_shipping_cost: row.buyerShippingCost,
        estimated_shipping_cost: row.estimatedShippingCost,
        estimated_shipping: row.estimatedShipping,
        created_at: row.createdAt,
        paid_at: row.paidAt || null,
        completed_at: row.completedAt || null,
      });
    }

    items.push({
      order_number: row.orderNumber,
      parent_sku: row.parentSku,
      product_name: row.productName,
      sku_reference: row.skuReference || null,
      variation_name: row.variationName || null,
      original_price: row.originalPrice,
      discounted_price: row.discountedPrice,
      quantity: row.quantity,
      buyer_paid: row.buyerPaid,
      total_discount: row.totalDiscount,
      seller_discount: row.sellerDiscount,
      shopee_discount: row.shopeeDiscount,
      product_weight: row.productWeight || null,
    });
  }

  return {
    orders,
    items,
    skippedCount: skippedStatuses.length > 0 ? new Set(skippedStatuses).size : 0,
  };
}
