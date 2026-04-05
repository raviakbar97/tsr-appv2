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
  sku_variations: Variation[]
  sku_fees: { fee_id: string; value: number; max_value: number | null; fee_tier_id: string | null; fees: Fee }[]
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
}

export default function SKUDetailView({ sku, fees, stockRows, transactions }: SKUDetailViewProps) {
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
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-3"
        >
          <ArrowLeft size={16} /> Back to Inventory
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{sku.name}</h1>
            <p className="text-sm text-gray-500 mt-1">
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
            </p>
          </div>
          <button
            onClick={() => setShowEdit(true)}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Pencil size={16} /> Edit SKU
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
            <Package size={16} /> Total Stock
          </div>
          <p className="text-2xl font-bold text-gray-900">{totalStock}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 text-sm mb-1">
            <TrendingUp size={16} className="text-green-600" />
            <span className="text-gray-500">Total In</span>
          </div>
          <p className="text-2xl font-bold text-green-600">
            {stockRows.reduce((s, r) => s + r.total_in, 0)}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 text-sm mb-1">
            <TrendingDown size={16} className="text-red-600" />
            <span className="text-gray-500">Total Out</span>
          </div>
          <p className="text-2xl font-bold text-red-600">
            {stockRows.reduce((s, r) => s + r.total_out, 0)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6 mb-6">
        {/* Variations */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-sm font-semibold text-gray-900 mb-3">Variations</h2>
          {sku.sku_variations.length === 0 ? (
            <p className="text-sm text-gray-400">No variations</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-500 text-xs">
                  <th className="text-left pb-2 font-medium">Name</th>
                  <th className="text-right pb-2 font-medium">Price Override</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {sku.sku_variations.map((v) => (
                  <tr key={v.id}>
                    <td className="py-2 text-gray-900">{v.variation_name}</td>
                    <td className="py-2 text-right text-gray-600">
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
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-sm font-semibold text-gray-900 mb-3">
            Assigned Fees
            {totalFeePercent > 0 && (
              <span className="text-xs font-normal text-purple-600 ml-1">
                ({totalFeePercent}% total percentage)
              </span>
            )}
            {totalFixedFees > 0 && (
              <span className="text-xs font-normal text-amber-600 ml-1">
                (+ Rp {totalFixedFees.toLocaleString('id-ID')} total fixed)
              </span>
            )}
          </h2>
          {sku.sku_fees.length === 0 ? (
            <p className="text-sm text-gray-400">No fees assigned</p>
          ) : (
            <div className="space-y-2">
              {sku.sku_fees.map((f) => {
                const tier = f.fee_tier_id
                  ? f.fees.fee_tiers?.find((t) => t.id === f.fee_tier_id)
                  : null
                return (
                <div key={f.fee_id} className="flex justify-between text-sm">
                  <span className="text-gray-900">
                    {f.fees.name}
                    {tier && (
                      <span className="ml-1 text-xs text-blue-600 font-medium">
                        ({tier.tier_name})
                      </span>
                    )}
                    <span className={`ml-1 text-xs ${
                      f.fees.fee_type === 'percentage' ? 'text-purple-600' : 'text-amber-600'
                    }`}>
                      ({f.fees.fee_type === 'percentage' ? '%' : 'IDR'})
                    </span>
                  </span>
                  <span className="text-gray-600">
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
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-gray-900">Stock by Variation</h2>
          <button
            onClick={() => setShowStockForm(true)}
            className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
          >
            Record Stock Movement
          </button>
        </div>
        {stockRows.length === 0 ? (
          <p className="text-sm text-gray-400">No stock movements recorded yet</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-gray-500 text-xs">
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
                    <td className="py-2 text-gray-900">{variation?.variation_name ?? 'Default'}</td>
                    <td className="py-2 text-right text-green-600">{row.total_in}</td>
                    <td className="py-2 text-right text-red-600">{row.total_out}</td>
                    <td className="py-2 text-right font-medium text-gray-900">
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
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-sm font-semibold text-gray-900 mb-3">Transaction History</h2>
        {transactions.length === 0 ? (
          <p className="text-sm text-gray-400">No transactions yet</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-gray-500 text-xs">
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
                    <td className="py-2 text-gray-600">{t.transaction_date}</td>
                    <td className="py-2 text-gray-900">{variation?.variation_name ?? 'Default'}</td>
                    <td className="py-2">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                          t.type === 'in'
                            ? 'bg-green-50 text-green-700'
                            : 'bg-red-50 text-red-700'
                        }`}
                      >
                        {t.type === 'in' ? 'Stock In' : 'Stock Out'}
                      </span>
                    </td>
                    <td className="py-2 text-right font-medium text-gray-900">{t.quantity}</td>
                    <td className="py-2 text-gray-500">{t.notes ?? '-'}</td>
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
