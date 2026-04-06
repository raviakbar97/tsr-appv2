'use client'

import { useState } from 'react'
import { Plus, Truck, XCircle, Trash2 } from 'lucide-react'
import { cancelPurchaseOrder, deletePurchaseOrder, receivePurchaseOrder } from '@/app/dashboard/inventory/warehouse/po/actions'
import PurchaseOrderForm from './PurchaseOrderForm'
import PurchaseOrderReceive from './PurchaseOrderReceive'

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
  status: 'pending' | 'received' | 'cancelled'
  note: string | null
  created_at: string
  purchase_order_items: POItem[]
}

interface WarehouseItem {
  id: string
  name: string
  unit: string
  buying_price: number
  source_type: 'purchased' | 'produced'
  unit_conversions?: { unit_name: string; factor: number }[]
}

interface PurchaseOrderTableProps {
  purchaseOrders: PurchaseOrder[]
  warehouseItems: WarehouseItem[]
}

const statusConfig: Record<string, { label: string; color: string }> = {
  pending: { label: 'Pending', color: 'bg-amber-50 text-amber-700' },
  received: { label: 'Received', color: 'bg-green-50 text-green-700' },
  cancelled: { label: 'Cancelled', color: 'bg-red-50 text-red-700' },
}

export default function PurchaseOrderTable({ purchaseOrders, warehouseItems }: PurchaseOrderTableProps) {
  const [showForm, setShowForm] = useState(false)
  const [receivePO, setReceivePO] = useState<PurchaseOrder | null>(null)
  const [loading, setLoading] = useState<string | null>(null)

  async function handleReceive(poId: string) {
    setLoading(poId)
    const result = await receivePurchaseOrder(poId)
    setLoading(null)
    if (result.error) {
      alert(result.error)
    } else {
      setReceivePO(null)
    }
  }

  async function handleCancel(poId: string) {
    if (!confirm('Cancel this PO?')) return
    setLoading(poId)
    const result = await cancelPurchaseOrder(poId)
    setLoading(null)
    if (result.error) alert(result.error)
  }

  async function handleDelete(poId: string) {
    if (!confirm('Delete this PO?')) return
    setLoading(poId)
    const result = await deletePurchaseOrder(poId)
    setLoading(null)
    if (result.error) alert(result.error)
  }

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-500">{purchaseOrders.length} purchase orders</p>
        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <Plus size={16} /> New PO
        </button>
      </div>

      <table className="w-full text-sm">
        <thead>
          <tr className="text-gray-500 text-xs border-b border-gray-100">
            <th className="text-left pb-3 font-medium">PO Number</th>
            <th className="text-left pb-3 font-medium">Supplier</th>
            <th className="text-left pb-3 font-medium">Status</th>
            <th className="text-center pb-3 font-medium">Items</th>
            <th className="text-right pb-3 font-medium">Total Value</th>
            <th className="text-left pb-3 font-medium">Date</th>
            <th className="text-right pb-3 font-medium">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {purchaseOrders.length === 0 ? (
            <tr>
              <td colSpan={7} className="py-8 text-center text-gray-500">
                No purchase orders yet
              </td>
            </tr>
          ) : (
            purchaseOrders.map((po) => {
              const totalValue = po.purchase_order_items.reduce(
                (sum, item) => sum + item.quantity * Number(item.unit_price),
                0
              )
              const status = statusConfig[po.status]

              return (
                <tr key={po.id}>
                  <td className="py-3 font-medium text-gray-900">{po.po_number}</td>
                  <td className="py-3 text-gray-700">{po.supplier}</td>
                  <td className="py-3">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${status.color}`}>
                      {status.label}
                    </span>
                  </td>
                  <td className="py-3 text-center text-gray-700">{po.purchase_order_items.length}</td>
                  <td className="py-3 text-right text-gray-700">
                    Rp {totalValue.toLocaleString('id-ID')}
                  </td>
                  <td className="py-3 text-gray-600">
                    {new Date(po.created_at).toLocaleDateString('id-ID', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </td>
                  <td className="py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      {po.status === 'pending' && (
                        <>
                          <button
                            onClick={() => setReceivePO(po)}
                            className="p-1.5 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-lg"
                            title="Receive"
                          >
                            <Truck size={14} />
                          </button>
                          <button
                            onClick={() => handleCancel(po.id)}
                            disabled={loading === po.id}
                            className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-50"
                            title="Cancel"
                          >
                            <XCircle size={14} />
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => handleDelete(po.id)}
                        disabled={loading === po.id}
                        className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-50"
                        title="Delete"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })
          )}
        </tbody>
      </table>

      {showForm && (
        <PurchaseOrderForm
          warehouseItems={warehouseItems}
          onClose={() => setShowForm(false)}
        />
      )}

      {receivePO && (
        <PurchaseOrderReceive
          po={receivePO}
          onConfirm={() => handleReceive(receivePO.id)}
          onClose={() => setReceivePO(null)}
          loading={loading === receivePO.id}
        />
      )}
    </>
  )
}
