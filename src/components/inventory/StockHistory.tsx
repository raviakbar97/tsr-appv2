'use client'

import { Trash2 } from 'lucide-react'
import { deleteStockTransaction } from '@/app/dashboard/inventory/stock/actions'

interface Variation {
  id: string
  variation_name: string
}

interface Transaction {
  id: string
  sku_id: string
  quantity: number
  type: 'in' | 'out'
  transaction_date: string
  notes: string | null
  variation_id: string | null
  created_at: string
  skus: { name: string; sku_code: string }
}

interface StockHistoryProps {
  transactions: Transaction[]
  variations: Variation[]
}

export default function StockHistory({ transactions, variations }: StockHistoryProps) {
  async function handleDelete(id: string, skuId: string) {
    if (confirm('Delete this transaction?')) {
      await deleteStockTransaction(id, skuId)
    }
  }

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-gray-50">
          <tr>
            <th className="text-left px-4 py-3 font-medium text-gray-600">Date</th>
            <th className="text-left px-4 py-3 font-medium text-gray-600">SKU</th>
            <th className="text-left px-4 py-3 font-medium text-gray-600">Variation</th>
            <th className="text-left px-4 py-3 font-medium text-gray-600">Type</th>
            <th className="text-right px-4 py-3 font-medium text-gray-600">Qty</th>
            <th className="text-left px-4 py-3 font-medium text-gray-600">Notes</th>
            <th className="text-right px-4 py-3 font-medium text-gray-600"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {transactions.length === 0 ? (
            <tr>
              <td colSpan={7} className="text-center py-8 text-gray-400">
                No stock movements recorded yet
              </td>
            </tr>
          ) : (
            transactions.map((t) => {
              const variation = variations.find((v) => v.id === t.variation_id)
              return (
                <tr key={t.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-600">{t.transaction_date}</td>
                  <td className="px-4 py-3">
                    <span className="font-medium text-gray-900">{t.skus.name}</span>
                    <span className="text-xs text-gray-400 ml-1">({t.skus.sku_code})</span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {variation?.variation_name ?? '-'}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                        t.type === 'in'
                          ? 'bg-green-50 text-green-700'
                          : 'bg-red-50 text-red-700'
                      }`}
                    >
                      {t.type === 'in' ? 'In' : 'Out'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-gray-900">{t.quantity}</td>
                  <td className="px-4 py-3 text-gray-500">{t.notes ?? '-'}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => handleDelete(t.id, t.sku_id)}
                      className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-red-600"
                      title="Delete"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              )
            })
          )}
        </tbody>
      </table>
    </div>
  )
}
