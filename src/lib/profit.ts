/**
 * Shared profit/margin calculation logic.
 * Used by both the Orders page and Dashboard to ensure identical results.
 */

export const ORDER_FLAT_FEE = 1250;

interface FeeDef {
  fee_type: string;
  value: number;
  max_value: number | null;
}

interface InputItem {
  sku_id: string | null;
  variation_id: string | null;
  discounted_price: number;
  quantity: number;
}

interface EnrichedItem {
  selling_price: number;
  base_price: number | null;
  admin_fee: number;
  margin: number | null;
}

export function enrichOrderItems(
  items: InputItem[],
  skuMap: Map<string, number>,
  variationMap: Map<string, number | null>,
  feesBySku: Map<string, FeeDef[]>,
): EnrichedItem[] {
  if (items.length === 0) return [];

  // First pass: per-item base price and SKU admin fee
  const raw = items.map((item) => {
    const sp = Number(item.discounted_price) * item.quantity;

    let basePrice: number | null = null;
    if (item.variation_id && variationMap.has(item.variation_id)) {
      const o = variationMap.get(item.variation_id);
      if (o != null) basePrice = Number(o) * item.quantity;
    } else if (item.sku_id && skuMap.has(item.sku_id)) {
      basePrice = skuMap.get(item.sku_id)! * item.quantity;
    }

    let adminFee = 0;
    if (item.sku_id && feesBySku.has(item.sku_id)) {
      for (const fee of feesBySku.get(item.sku_id)!) {
        let fa = fee.fee_type === "percentage" ? (fee.value / 100) * sp : fee.value;
        if (fee.max_value != null) fa = Math.min(fa, fee.max_value);
        adminFee += fa;
      }
    }
    adminFee = Math.round(adminFee);

    return { sp, basePrice, adminFee };
  });

  // Second pass: distribute flat per-order fee proportionally
  const totalSelling = raw.reduce((s, i) => s + i.sp, 0);
  let feeRemaining = ORDER_FLAT_FEE;

  return raw.map((r, idx) => {
    const share =
      idx < raw.length - 1
        ? Math.round((r.sp / totalSelling) * ORDER_FLAT_FEE)
        : feeRemaining;
    feeRemaining -= share;

    const admin_fee = r.adminFee + share;
    const margin =
      r.basePrice != null
        ? Math.round(r.sp - r.basePrice - admin_fee)
        : null;

    return {
      selling_price: r.sp,
      base_price: r.basePrice,
      admin_fee,
      margin,
    };
  });
}
