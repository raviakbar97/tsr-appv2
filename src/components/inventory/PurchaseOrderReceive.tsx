'use client'

import { X, Truck } from 'lucide-react'

interface POItem {
  id: string
  warehouse_item_id: string
  quantity: number
  unit_price: number
  warehouse_items?: { id: string; name: string; unit: string } | null
}

interface PurchaseOrder {
  id: string
  po_number: string
  supplier: string
  purchase_order_items: POItem[]
}

interface PurchaseOrderReceiveProps {
  po: PurchaseOrder
  onConfirm: () => void
  onClose: () => void
  loading: boolean
}

export default function PurchaseOrderReceive({ po, onConfirm, onClose, loading }: PurchaseOrderReceiveProps) {
  const totalValue = po.purchase_order_items.reduce(
    (sum, item) => sum + item.quantity * Number(item.unit_price),
    0
  )

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-[var(--surface)] rounded-xl p-6 w-full max-w-lg shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-[var(--foreground)]">Receive PO — {po.po_number}</h2>
          <button onClick={onClose} className="text-[var(--muted)] hover:text-[var(--foreground-secondary)]">
            <X size={20} />
          </button>
        </div>

        <div className="mb-4">
          <p className="text-sm text-[var(--foreground-secondary)]">
            Supplier: <span className="font-medium text-[var(--foreground)]">{po.supplier}</span>
          </p>
        </div>

        <div className="mb-4">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[var(--muted)] text-xs">
                <th className="text-left pb-2 font-medium">Item</th>
                <th className="text-right pb-2 font-medium">Qty</th>
                <th className="text-right pb-2 font-medium">Unit Price</th>
                <th className="text-right pb-2 font-medium">Subtotal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {po.purchase_order_items.map((item) => (
                <tr key={item.id}>
                  <td className="py-2 text-[var(--foreground)]">
                    {item.warehouse_items?.name ?? 'Unknown'}
                  </td>
                  <td className="py-2 text-right text-[var(--foreground-secondary)]">{item.quantity}</td>
                  <td className="py-2 text-right text-[var(--foreground-secondary)]">
                    Rp {Number(item.unit_price).toLocaleString('id-ID')}
                  </td>
                  <td className="py-2 text-right font-medium text-[var(--foreground)]">
                    Rp {(item.quantity * Number(item.unit_price)).toLocaleString('id-ID')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex justify-between items-center py-3 border-t border-[var(--border)] mb-4">
          <span className="text-sm font-medium text-[var(--foreground-secondary)]">Total</span>
          <span className="text-sm font-bold text-[var(--foreground)]">Rp {totalValue.toLocaleString('id-ID')}</span>
        </div>

        <p className="text-sm text-[var(--muted)] mb-4">
          Confirming will increase stock for each item and record warehouse transactions.
        </p>

        <div className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-[var(--foreground-secondary)] bg-[var(--surface-hover)] rounded-lg hover:bg-[var(--border)]"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
          >
            <Truck size={14} />
            {loading ? 'Receiving...' : 'Confirm Receive'}
          </button>
        </div>
      </div>
    </div>
  )
}
