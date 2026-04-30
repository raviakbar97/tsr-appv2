'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { enrichOrderItems, ORDER_FLAT_FEE } from '@/lib/profit'

export interface AccountingPeriod {
  id: string
  start_date: string
  end_date: string
  period_name: string
  status: string
  is_locked: boolean
  total_orders: number
  total_items_sold: number
  total_revenue: string
  total_cost: string
  total_cogs: string
  total_admin_fee: string
  total_service_fee: string
  total_other_fees: string
  total_margin: string
  margin_percentage: string
  closed_at: string
  created_at: string
  updated_at: string
}

export interface PeriodSKUStat {
  id: string
  period_id: string
  sku_id: string
  sku_code: string
  sku_name: string
  quantity_sold: number
  total_revenue: string
  total_cogs: string
  total_admin_fee: string
  total_service_fee: string
  total_other_fees: string
  total_margin: string
  revenue_percentage: string
}

export interface IncompleteOrder {
  id: string
  order_number: string
  buyer_username: string | null
  created_at: string
  reason: string
}

export interface ClosablePeriod {
  startDate: string
  endDate: string
  periodName: string
  orderCount: number
  canClose: boolean
  incompleteOrders: IncompleteOrder[]
}

// Get all accounting periods
export async function getAccountingPeriods() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('accounting_periods')
    .select('*')
    .order('start_date', { ascending: false })

  if (error) return { error: error.message }
  return { periods: data as AccountingPeriod[] }
}

// Get period details with SKU stats
export async function getPeriodDetails(periodId: string) {
  const supabase = await createClient()

  const [periodResult, statsResult] = await Promise.all([
    supabase.from('accounting_periods').select('*').eq('id', periodId).single(),
    supabase
      .from('accounting_period_sku_stats')
      .select('*')
      .eq('period_id', periodId)
      .order('total_revenue', { ascending: false }),
  ])

  if (periodResult.error) return { error: periodResult.error.message }
  if (statsResult.error) return { error: statsResult.error.message }
  if (!periodResult.data) return { error: 'Period not found' }

  return {
    period: periodResult.data as AccountingPeriod,
    stats: (statsResult.data ?? []) as PeriodSKUStat[],
  }
}

// Generate billing periods (26th to 25th) based on existing closed periods
export async function getAvailablePeriods(): Promise<ClosablePeriod[]> {
  const supabase = await createClient()

  const { data: closedPeriods } = await supabase
    .from('accounting_periods')
    .select('start_date, end_date')
    .order('start_date', { ascending: true })

  const closedRanges = new Set(
    closedPeriods?.map((p) => `${p.start_date}|${p.end_date}`) ?? []
  )

  const { data: orders } = await supabase
    .from('orders')
    .select('paid_at, created_at')
    .order('created_at', { ascending: true })
    .limit(1)

  const { data: lastOrder } = await supabase
    .from('orders')
    .select('paid_at, created_at')
    .order('created_at', { ascending: false })
    .limit(1)

  if (!orders?.length || !lastOrder?.length) return []

  const firstDate = orders[0].paid_at
    ? new Date(orders[0].paid_at)
    : new Date(orders[0].created_at)
  const lastDate = lastOrder[0].paid_at
    ? new Date(lastOrder[0].paid_at)
    : new Date(lastOrder[0].created_at)

  const periods: ClosablePeriod[] = []
  let currentDate = new Date(firstDate)
  currentDate.setDate(26)
  const now = new Date()

  while (currentDate <= lastDate) {
    const startDate = new Date(currentDate)
    const endDate = new Date(currentDate)
    endDate.setMonth(endDate.getMonth() + 1)
    endDate.setDate(25)

    if (endDate > now) break

    const startDateStr = startDate.toISOString().split('T')[0]
    const endDateStr = endDate.toISOString().split('T')[0]
    const periodKey = `${startDateStr}|${endDateStr}`

    if (closedRanges.has(periodKey)) {
      currentDate.setMonth(currentDate.getMonth() + 1)
      continue
    }

    const periodName = `${startDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })} - ${endDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`

    const orderCountResult = await supabase
      .from('orders')
      .select('id, order_number, buyer_username, created_at, order_items(id, sku_id, variation_id)')
      .is('accounting_period_id', null)
      .gte('paid_at', startDateStr)
      .lte('paid_at', endDateStr + 'T23:59:59')

    const { data: ordersNoPaid } = await supabase
      .from('orders')
      .select('id, order_number, buyer_username, created_at, order_items(id, sku_id, variation_id)')
      .is('accounting_period_id', null)
      .is('paid_at', null)
      .gte('created_at', startDateStr)
      .lte('created_at', endDateStr + 'T23:59:59')

    const allOrders = [...(orderCountResult.data ?? []), ...(ordersNoPaid ?? [])]

    const incompleteOrders: IncompleteOrder[] = []
    for (const order of allOrders) {
      const hasUnlinkedItems = order.order_items?.some(
        (item: { sku_id: string | null; variation_id: string | null }) =>
          !item.sku_id && !item.variation_id
      )

      if (hasUnlinkedItems) {
        incompleteOrders.push({
          id: order.id,
          order_number: order.order_number,
          buyer_username: order.buyer_username,
          created_at: order.created_at,
          reason: 'Some items are not linked to SKU/Variation',
        })
      }
    }

    periods.push({
      startDate: startDateStr,
      endDate: endDateStr,
      periodName,
      orderCount: allOrders.length,
      canClose: allOrders.length > 0 && incompleteOrders.length === 0,
      incompleteOrders,
    })

    currentDate.setMonth(currentDate.getMonth() + 1)
  }

  return periods.reverse()
}

// Get orders NOT yet assigned to any accounting period
export async function getUnassignedOrders(
  startDate: string,
  endDate: string
) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('orders')
    .select('id, order_number, buyer_username, paid_at, created_at, order_items(id, sku_id, variation_id, discounted_price, quantity)')
    .is('accounting_period_id', null)
    .gte('paid_at', startDate)
    .lte('paid_at', endDate + 'T23:59:59')

  const { data: noPaidData, error: noPaidError } = await supabase
    .from('orders')
    .select('id, order_number, buyer_username, paid_at, created_at, order_items(id, sku_id, variation_id, discounted_price, quantity)')
    .is('accounting_period_id', null)
    .is('paid_at', null)
    .gte('created_at', startDate)
    .lte('created_at', endDate + 'T23:59:59')

  if (error || noPaidError) return { error: error?.message ?? noPaidError?.message }

  return { orders: [...(data ?? []), ...(noPaidData ?? [])] }
}

// Close accounting period - using the shared profit calculation logic
export async function closeAccountingPeriod(startDate: string, endDate: string) {
  const supabase = await createClient()

  const availablePeriods = await getAvailablePeriods()
  const selectedPeriod = availablePeriods.find(
    (p) => p.startDate === startDate && p.endDate === endDate
  )

  if (!selectedPeriod) {
    return { error: 'Period not found or already closed' }
  }

  if (!selectedPeriod.canClose) {
    return {
      error: 'Cannot close period: incomplete orders exist',
      incompleteOrders: selectedPeriod.incompleteOrders,
    }
  }

  const orderResult = await getUnassignedOrders(startDate, endDate)
  if ('error' in orderResult) return { error: 'Failed to fetch orders' }
  const orders = orderResult.orders ?? []

  if (orders.length === 0) {
    return { error: 'No orders found for this period' }
  }

  const orderIds = orders.map((o: any) => o.id)

  // Collect SKU and variation IDs
  const skuIds = [...new Set<string>(
    orders.flatMap((o: any) =>
      (o.order_items?.map((i: any) => i.sku_id) ?? []).filter((v: any): v is string => Boolean(v))
    )
  )]
  const variationIds = [...new Set<string>(
    orders.flatMap((o: any) =>
      (o.order_items?.map((i: any) => i.variation_id) ?? []).filter((v: any): v is string => Boolean(v))
    )
  )]

  // Fetch SKU base prices, variation overrides, and fees
  const [pricesRes, varPricesRes, feesRes] = await Promise.all([
    skuIds.length > 0
      ? supabase.from('skus').select('id, sku_code, name, base_price').in('id', skuIds)
      : Promise.resolve({ data: [] }),
    variationIds.length > 0
      ? supabase.from('sku_variations').select('id, base_price_override').in('id', variationIds)
      : Promise.resolve({ data: [] }),
    skuIds.length > 0
      ? supabase.from('sku_fees').select('sku_id, value, max_value, fees(fee_type)').in('sku_id', skuIds)
      : Promise.resolve({ data: [] }),
  ])

  // Build lookup maps (same as orders page)
  const skuMap = new Map((pricesRes.data ?? []).map((s: any) => [s.id, Number(s.base_price)]))
  const skuInfoMap = new Map((pricesRes.data ?? []).map((s: any) => [s.id, { sku_code: s.sku_code, name: s.name }]))
  const variationMap = new Map((varPricesRes.data ?? []).map((v: any) => [v.id, v.base_price_override]))

  const feesBySku = new Map<string, { fee_type: string; value: number; max_value: number | null }[]>()
  for (const sf of (feesRes.data ?? [])) {
    const list = feesBySku.get(sf.sku_id) ?? []
    list.push({
      fee_type: (sf.fees as unknown as { fee_type: string })?.fee_type ?? 'percentage',
      value: Number(sf.value),
      max_value: sf.max_value != null ? Number(sf.max_value) : null,
    })
    feesBySku.set(sf.sku_id, list)
  }

  // Calculate per-SKU stats using the shared enrichment logic
  const skuStatsMap = new Map<
    string,
    {
      sku_id: string
      sku_code: string
      sku_name: string
      quantity_sold: number
      total_revenue: number
      total_cogs: number
      total_admin_fee: number
    }
  >()

  let totalRevenue = 0
  let totalCogs = 0
  let totalAdminFee = 0
  let totalItemsSold = 0

  // Process each order
  for (const order of orders) {

    // Enrich items using shared profit logic
    const enriched = enrichOrderItems(
      (order.order_items ?? []).map((item: any) => ({
        sku_id: item.sku_id,
        variation_id: item.variation_id,
        discounted_price: Number(item.discounted_price),
        quantity: item.quantity,
      })),
      skuMap,
      variationMap,
      feesBySku,
    )

    // Aggregate by SKU
    enriched.forEach((item, idx) => {
      const rawItem = order.order_items[idx]
      const skuId = rawItem?.sku_id

      if (!skuId) return

      const revenue = item.selling_price
      const cogs = item.base_price ?? 0
      const adminFee = item.admin_fee
      const qty = rawItem?.quantity || 1

      totalRevenue += revenue
      totalCogs += cogs
      totalAdminFee += adminFee
      totalItemsSold += qty

      // Get SKU info
      const skuInfo = skuInfoMap.get(skuId)
      if (skuInfo) {
        const existing = skuStatsMap.get(skuId)
        if (existing) {
          existing.quantity_sold += qty
          existing.total_revenue += revenue
          existing.total_cogs += cogs
          existing.total_admin_fee += adminFee
        } else {
          skuStatsMap.set(skuId, {
            sku_id: skuId,
            sku_code: skuInfo.sku_code,
            sku_name: skuInfo.name,
            quantity_sold: qty,
            total_revenue: revenue,
            total_cogs: cogs,
            total_admin_fee: adminFee,
          })
        }
      }
    })
  }

  // Calculate totals (same formula as orders page)
  const totalCost = totalCogs + totalAdminFee
  const totalMargin = totalRevenue - totalCost
  const marginPercentage = totalRevenue > 0 ? (totalMargin / totalRevenue) * 100 : 0

  // Generate period name
  const start = new Date(startDate)
  const end = new Date(endDate)
  const periodName = `${start.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })} - ${end.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`

  // Create accounting period
  const { data: period, error: periodError } = await supabase
    .from('accounting_periods')
    .insert({
      start_date: startDate,
      end_date: endDate,
      period_name: periodName,
      status: 'closed',
      is_locked: true,
      total_orders: orders.length,
      total_items_sold: totalItemsSold,
      total_revenue: totalRevenue.toFixed(2),
      total_cogs: totalCogs.toFixed(2),
      total_cost: totalCost.toFixed(2),
      total_admin_fee: totalAdminFee.toFixed(2),
      total_service_fee: '0',
      total_other_fees: '0',
      total_margin: totalMargin.toFixed(2),
      margin_percentage: marginPercentage.toFixed(2),
    })
    .select('id')
    .single()

  if (periodError) return { error: periodError.message }

  // Insert SKU stats
  const skuStatsInserts = Array.from(skuStatsMap.values()).map((stat) => {
    const statCost = stat.total_cogs + stat.total_admin_fee
    const statMargin = stat.total_revenue - statCost

    return {
      period_id: period.id,
      sku_id: stat.sku_id,
      sku_code: stat.sku_code,
      sku_name: stat.sku_name,
      quantity_sold: stat.quantity_sold,
      total_revenue: stat.total_revenue.toFixed(2),
      total_cogs: stat.total_cogs.toFixed(2),
      total_cost: statCost.toFixed(2),
      total_admin_fee: stat.total_admin_fee.toFixed(2),
      total_service_fee: '0',
      total_other_fees: '0',
      total_margin: statMargin.toFixed(2),
      revenue_percentage: totalRevenue > 0 ? ((stat.total_revenue / totalRevenue) * 100).toFixed(2) : '0',
    }
  })

  if (skuStatsInserts.length > 0) {
    const { error: statsError } = await supabase
      .from('accounting_period_sku_stats')
      .insert(skuStatsInserts)

    if (statsError) return { error: statsError.message }
  }

  // Link orders to period
  const { error: updateError } = await supabase
    .from('orders')
    .update({ accounting_period_id: period.id })
    .in('id', orderIds)

  if (updateError) return { error: updateError.message }

  revalidatePath('/dashboard/finance')
  revalidatePath('/dashboard/finance/[id]')

  return {
    success: true,
    periodId: period.id,
    totalOrders: orders.length,
    totalRevenue,
    totalMargin,
  }
}

// Delete accounting period - reopens it by unlinking orders and removing the record
export async function deleteAccountingPeriod(periodId: string) {
  const supabase = await createClient()

  const { error: updateError } = await supabase
    .from('orders')
    .update({ accounting_period_id: null })
    .eq('accounting_period_id', periodId)

  if (updateError) return { error: updateError.message }

  const { error: deleteError } = await supabase
    .from('accounting_periods')
    .delete()
    .eq('id', periodId)

  if (deleteError) return { error: deleteError.message }

  revalidatePath('/dashboard/finance')
  revalidatePath('/dashboard/finance/[id]')

  return { success: true }
}
