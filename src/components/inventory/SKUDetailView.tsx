'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Pencil, Package, TrendingUp, TrendingDown } from 'lucide-react'
import SKUForm from './SKUForm'
import StockForm from './StockForm'

interface FeeTier {
  id: string
  tier_name: string
  value: number
  max_value: number | null
  sort_order: number
}

interface Fee {
  id: string
  name: string
  fee_type: 'fixed' | 'percentage'
  is_active: boolean
  fee_tiers?: FeeTier[]
}

interface Variation {
  id: string
  variation_name: string
  base_price_override: number | null
}

interface SKU {
  id: string
  name: string
  sku_code: string
  base_price: number
  is_active: boolean
  warehouse_item_id?: string | null
  warehouse_item_qty?: number | null
  sku_variations: Variation[]
  sku_fees: { fee_id: string; value: number; max_value: number | null; fee_tier_id: string | null; fees: Fee }[]
}

interface WarehouseItem {
  id: string
  name: string
  unit: string
  source_type: 'purchased' | 'produced'
}

interface StockRow {
  sku_id: string
  variation_id: string | null
  total_in: number
  total_out: number
  current_quantity: number
}

interface Transaction {
  id: string
  quantity: number
  type: 'in' | 'out'
  transaction_date: string
  notes: string | null
  variation_id: string | null
  created_at: string
}

interface SKUDetailViewProps {
  sku: SKU
  fees: Fee[]
  stockRows: StockRow[]
  transactions: Transaction[]
  warehouseItems?: WarehouseItem[]
}

export default function SKUDetailView({ sku, fees, stockRows, transactions, warehouseItems = [] }: SKUDetailViewProps) {
  const [showEdit, setShowEdit] = useState(false)
  const [showStockForm, setShowStockForm] = useState(false)

  const totalFeePercent = sku.sku_fees
    .filter((f) => f.fees.fee_type === 'percentage')
    .reduce((sum, f) => sum + f.value, 0)
  const totalFixedFees = sku.sku_fees
    .filter((f) => f.fees.fee_type === 'fixed')
    .reduce((sum, f) => sum + f.value, 0)
  const totalStock = stockRows.reduce((sum, r) => sum + r.current_quantity, 0)

  return (
    <>
      <div className="mb-6">
        <Link
          href="/dashboard/inventory"
          className="inline-flex items-center gap-1 text-sm text-[var(--muted)] hover:text-[var(--foreground-secondary)] mb-3"
        >
          <ArrowLeft size={16} /> Back to Inventory
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[var(--foreground)]">{sku.name}</h1>
            <p className="text-sm text-[var(--muted)] mt-1">
              {sku.sku_code} &middot; {(() => {
                if (sku.sku_variations.length === 0)
                  return `Rp ${Number(sku.base_price).toLocaleString('id-ID')}`
                const prices = sku.sku_variations
                  .map((v) => v.base_price_override)
                  .filter((p): p is number => p !== null && p > 0)
                if (prices.length === 0)
                  return `Rp ${Number(sku.base_price).toLocaleString('id-ID')}`
                const min = Math.min(...prices)
                const max = Math.max(...prices)
                return min === max
                  ? `Rp ${Number(min).toLocaleString('id-ID')}`
                  : `Rp ${Number(min).toLocaleString('id-ID')} - ${Number(max).toLocaleString('id-ID')}`
              })()}
              {sku.warehouse_item_id && (() => {
                const whItem = warehouseItems.find(w => w.id === sku.warehouse_item_id)
                return whItem ? (
                  <span className="ml-2 text-xs text-[var(--primary)] bg-[var(--primary-light)] px-2 py-0.5 rounded-full">
                    Warehouse: {whItem.name} (x{sku.warehouse_item_qty ?? 1})
                  </span>
                ) : null
              })()}
            </p>
          </div>
          <button
            onClick={() => setShowEdit(true)}
            className="px-4 py-2 text-sm font-medium text-white bg-[var(--primary)] rounded-lg hover:bg-[var(--primary-hover)] flex items-center gap-2"
          >
            <Pencil size={16} /> Edit SKU
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-[var(--surface)] rounded-xl border border-[var(--border)] p-4">
          <div className="flex items-center gap-2 text-[var(--muted)] text-sm mb-1">
            <Package size={16} /> Total Stock
          </div>
          <p className="text-2xl font-bold text-[var(--foreground)]">{totalStock}</p>
        </div>
        <div className="bg-[var(--surface)] rounded-xl border border-[var(--border)] p-4">
          <div className="flex items-center gap-2 text-sm mb-1">
            <TrendingUp size={16} className="text-green-600" />
            <span className="text-[var(--muted)]">Total In</span>
          </div>
          <p className="text-2xl font-bold text-green-600">
            {stockRows.reduce((s, r) => s + r.total_in, 0)}
          </p>
        </div>
        <div className="bg-[var(--surface)] rounded-xl border border-[var(--border)] p-4">
          <div className="flex items-center gap-2 text-sm mb-1">
            <TrendingDown size={16} className="text-[var(--danger)]" />
            <span className="text-[var(--muted)]">Total Out</span>
          </div>
          <p className="text-2xl font-bold text-[var(--danger)]">
            {stockRows.reduce((s, r) => s + r.total_out, 0)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6 mb-6">
        {/* Variations */}
        <div className="bg-[var(--surface)] rounded-xl border border-[var(--border)] p-6">
          <h2 className="text-sm font-semibold text-[var(--foreground)] mb-3">Variations</h2>
          {sku.sku_variations.length === 0 ? (
            <p className="text-sm text-[var(--muted)]">No variations</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[var(--muted)] text-xs">
                  <th className="text-left pb-2 font-medium">Name</th>
                  <th className="text-right pb-2 font-medium">Price Override</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {sku.sku_variations.map((v) => (
                  <tr key={v.id}>
                    <td className="py-2 text-[var(--foreground)]">{v.variation_name}</td>
                    <td className="py-2 text-right text-[var(--foreground-secondary)]">
                      {v.base_price_override
                        ? `Rp ${Number(v.base_price_override).toLocaleString('id-ID')}`
                        : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Fees */}
        <div className="bg-[var(--surface)] rounded-xl border border-[var(--border)] p-6">
          <h2 className="text-sm font-semibold text-[var(--foreground)] mb-3">
            Assigned Fees
            {totalFeePercent > 0 && (
              <span className="text-xs font-normal text-purple-600 ml-1">
                ({totalFeePercent}% total percentage)
              </span>
            )}
            {totalFixedFees > 0 && (
              <span className="text-xs font-normal text-[var(--warning)] ml-1">
                (+ Rp {totalFixedFees.toLocaleString('id-ID')} total fixed)
              </span>
            )}
          </h2>
          {sku.sku_fees.length === 0 ? (
            <p className="text-sm text-[var(--muted)]">No fees assigned</p>
          ) : (
            <div className="space-y-2">
              {sku.sku_fees.map((f) => {
                const tier = f.fee_tier_id
                  ? f.fees.fee_tiers?.find((t) => t.id === f.fee_tier_id)
                  : null
                return (
                <div key={f.fee_id} className="flex justify-between text-sm">
                  <span className="text-[var(--foreground)]">
                    {f.fees.name}
                    {tier && (
                      <span className="ml-1 text-xs text-[var(--primary)] font-medium">
                        ({tier.tier_name})
                      </span>
                    )}
                    <span className={`ml-1 text-xs ${
                      f.fees.fee_type === 'percentage' ? 'text-purple-600' : 'text-[var(--warning)]'
                    }`}>
                      ({f.fees.fee_type === 'percentage' ? '%' : 'IDR'})
                    </span>
                  </span>
                  <span className="text-[var(--foreground-secondary)]">
                    {f.fees.fee_type === 'percentage'
                      ? `${f.value}%${f.max_value ? ` (max Rp ${Number(f.max_value).toLocaleString('id-ID')})` : ''}`
                      : `Rp ${Number(f.value).toLocaleString('id-ID')}`}
                  </span>
                </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Stock by Variation */}
      <div className="bg-[var(--surface)] rounded-xl border border-[var(--border)] p-6 mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-[var(--foreground)]">Stock by Variation</h2>
          <button
            onClick={() => setShowStockForm(true)}
            className="px-3 py-1.5 text-sm font-medium text-white bg-[var(--primary)] rounded-lg hover:bg-[var(--primary-hover)]"
          >
            Record Stock Movement
          </button>
        </div>
        {stockRows.length === 0 ? (
          <p className="text-sm text-[var(--muted)]">No stock movements recorded yet</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[var(--muted)] text-xs">
                <th className="text-left pb-2 font-medium">Variation</th>
                <th className="text-right pb-2 font-medium">In</th>
                <th className="text-right pb-2 font-medium">Out</th>
                <th className="text-right pb-2 font-medium">Current</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {stockRows.map((row) => {
                const variation = sku.sku_variations.find((v) => v.id === row.variation_id)
                return (
                  <tr key={row.variation_id ?? 'default'}>
                    <td className="py-2 text-[var(--foreground)]">{variation?.variation_name ?? 'Default'}</td>
                    <td className="py-2 text-right text-green-600">{row.total_in}</td>
                    <td className="py-2 text-right text-[var(--danger)]">{row.total_out}</td>
                    <td className="py-2 text-right font-medium text-[var(--foreground)]">
                      {row.current_quantity}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Transaction History */}
      <div className="bg-[var(--surface)] rounded-xl border border-[var(--border)] p-6">
        <h2 className="text-sm font-semibold text-[var(--foreground)] mb-3">Transaction History</h2>
        {transactions.length === 0 ? (
          <p className="text-sm text-[var(--muted)]">No transactions yet</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[var(--muted)] text-xs">
                <th className="text-left pb-2 font-medium">Date</th>
                <th className="text-left pb-2 font-medium">Variation</th>
                <th className="text-left pb-2 font-medium">Type</th>
                <th className="text-right pb-2 font-medium">Qty</th>
                <th className="text-left pb-2 font-medium">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {transactions.map((t) => {
                const variation = sku.sku_variations.find((v) => v.id === t.variation_id)
                return (
                  <tr key={t.id}>
                    <td className="py-2 text-[var(--foreground-secondary)]">{t.transaction_date}</td>
                    <td className="py-2 text-[var(--foreground)]">{variation?.variation_name ?? 'Default'}</td>
                    <td className="py-2">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                          t.type === 'in'
                            ? 'bg-green-50 text-[var(--accent)]'
                            : 'bg-[var(--danger-light)] text-[var(--danger)]'
                        }`}
                      >
                        {t.type === 'in' ? 'Stock In' : 'Stock Out'}
                      </span>
                    </td>
                    <td className="py-2 text-right font-medium text-[var(--foreground)]">{t.quantity}</td>
                    <td className="py-2 text-[var(--muted)]">{t.notes ?? '-'}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {showEdit && (
        <SKUForm
          sku={sku}
          fees={fees}
          warehouseItems={warehouseItems}
          onClose={() => setShowEdit(false)}
        />
      )}

      {showStockForm && (
        <StockForm
          skuId={sku.id}
          variations={sku.sku_variations}
          onClose={() => setShowStockForm(false)}
        />
      )}
    </>
  )
}
