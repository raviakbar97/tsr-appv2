"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Package, ChevronDown, ChevronRight, Trash2, Calendar, Loader2, AlertTriangle } from "lucide-react";
import { pruneOrders } from "@/app/dashboard/orders/actions";

interface EnrichedItem {
  product_name: string;
  parent_sku: string;
  quantity: number;
  selling_price: number;
  base_price: number | null;
  admin_fee: number;
  margin: number | null;
}

interface EnrichedOrder {
  id: string;
  order_number: string;
  order_status: string;
  created_at: string;
  paid_at: string | null;
  payment_method: string | null;
  buyer_username: string | null;
  city: string | null;
  province: string | null;
  items: EnrichedItem[];
  total_selling: number;
  total_base: number | null;
  total_admin_fee: number;
  total_margin: number | null;
}

interface OrderTableProps {
  orders: EnrichedOrder[];
}

export default function OrderTable({ orders }: OrderTableProps) {
  const router = useRouter();
  const [filter, setFilter] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [showPrune, setShowPrune] = useState(false);
  const [pruneFrom, setPruneFrom] = useState("");
  const [pruneTo, setPruneTo] = useState("");
  const [pruning, setPruning] = useState(false);
  const [confirmAll, setConfirmAll] = useState(false);
  const [confirmRange, setConfirmRange] = useState(false);
  const [pruneError, setPruneError] = useState<string | null>(null);

  const filtered = filter
    ? orders.filter(
        (o) =>
          o.order_number.toLowerCase().includes(filter.toLowerCase()) ||
          o.order_status.toLowerCase().includes(filter.toLowerCase()) ||
          o.items.some((i) =>
            i.product_name.toLowerCase().includes(filter.toLowerCase())
          )
      )
    : orders;

  async function handlePruneAll() {
    setPruning(true);
    setPruneError(null);
    const res = await pruneOrders("all");
    if (res.error) {
      setPruneError(res.error);
      setPruning(false);
    } else {
      setPruning(false);
      setConfirmAll(false);
      setShowPrune(false);
      router.refresh();
    }
  }

  async function handlePruneRange() {
    if (!pruneFrom || !pruneTo) return;
    setPruning(true);
    setPruneError(null);
    const res = await pruneOrders("range", pruneFrom, pruneTo);
    if (res.error) {
      setPruneError(res.error);
      setPruning(false);
    } else {
      setPruning(false);
      setConfirmRange(false);
      setShowPrune(false);
      router.refresh();
    }
  }

  return (
    <div>
      {/* Toolbar */}
      <div className="mb-4 flex items-center gap-3">
        <input
          type="text"
          placeholder="Search orders..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="flex-1 max-w-md px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={() => { setShowPrune(!showPrune); setConfirmAll(false); setConfirmRange(false); setPruneError(null); }}
          className="flex items-center gap-2 px-3 py-2 border border-red-200 rounded-lg text-sm text-red-700 hover:bg-red-50 transition-colors"
        >
          <Trash2 size={14} />
          Prune Data
        </button>
      </div>

      {/* Prune panel */}
      {showPrune && (
        <div className="mb-4 bg-white border border-gray-200 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Calendar size={16} className="text-gray-800" />
            <span className="text-sm font-medium text-gray-900">Prune Order Data</span>
          </div>

          {pruneError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex items-center gap-2">
              <AlertTriangle size={14} />
              {pruneError}
            </div>
          )}

          {/* Prune all */}
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg mb-3">
            <div>
              <p className="text-sm font-medium text-gray-900">Delete All Orders</p>
              <p className="text-xs text-gray-800">{orders.length} orders will be permanently deleted</p>
            </div>
            {confirmAll ? (
              <div className="flex items-center gap-2">
                <span className="text-xs text-red-700 font-medium">Are you sure?</span>
                <button
                  onClick={handlePruneAll}
                  disabled={pruning}
                  className="px-3 py-1.5 bg-red-600 text-white rounded-md text-xs hover:bg-red-700 disabled:opacity-50 flex items-center gap-1"
                >
                  {pruning && <Loader2 size={12} className="animate-spin" />}
                  Yes, Delete
                </button>
                <button
                  onClick={() => setConfirmAll(false)}
                  className="px-3 py-1.5 border border-gray-300 rounded-md text-xs hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmAll(true)}
                className="px-3 py-1.5 bg-red-600 text-white rounded-md text-xs hover:bg-red-700"
              >
                Delete All
              </button>
            )}
          </div>

          {/* Prune by date range */}
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900 mb-2">Delete by Date Range</p>
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={pruneFrom}
                  onChange={(e) => setPruneFrom(e.target.value)}
                  className="[color-scheme:light] px-2 py-1.5 border border-gray-300 rounded-md text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <span className="text-xs text-gray-800">to</span>
                <input
                  type="date"
                  value={pruneTo}
                  onChange={(e) => setPruneTo(e.target.value)}
                  className="[color-scheme:light] px-2 py-1.5 border border-gray-300 rounded-md text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
            {confirmRange ? (
              <div className="flex items-center gap-2">
                <span className="text-xs text-red-700 font-medium">Are you sure?</span>
                <button
                  onClick={handlePruneRange}
                  disabled={pruning || !pruneFrom || !pruneTo}
                  className="px-3 py-1.5 bg-red-600 text-white rounded-md text-xs hover:bg-red-700 disabled:opacity-50 flex items-center gap-1"
                >
                  {pruning && <Loader2 size={12} className="animate-spin" />}
                  Yes, Delete
                </button>
                <button
                  onClick={() => setConfirmRange(false)}
                  className="px-3 py-1.5 border border-gray-300 rounded-md text-xs hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => { if (pruneFrom && pruneTo) setConfirmRange(true); }}
                disabled={!pruneFrom || !pruneTo}
                className="px-3 py-1.5 bg-red-600 text-white rounded-md text-xs hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Delete Range
              </button>
            )}
          </div>
        </div>
      )}

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
          <Package size={48} className="mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600">No orders yet</p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl overflow-x-auto">
          <table className="w-full text-sm text-gray-900">
            <thead className="bg-gray-50">
              <tr>
                <th className="w-8 px-3 py-3"></th>
                <th className="text-left px-4 py-3 font-medium">Date</th>
                <th className="text-left px-4 py-3 font-medium">Order #</th>
                <th className="text-left px-4 py-3 font-medium">Product</th>
                <th className="text-right px-4 py-3 font-medium">Selling Price</th>
                <th className="text-right px-4 py-3 font-medium">Base Price</th>
                <th className="text-right px-4 py-3 font-medium">Admin Fee</th>
                <th className="text-right px-4 py-3 font-medium">Clean Margin</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((order) => {
                const isOpen = expanded === order.id;
                return (
                  <React.Fragment key={order.id}>
                    <tr
                      className="border-t border-gray-100 hover:bg-gray-50 cursor-pointer"
                      onClick={() => setExpanded(isOpen ? null : order.id)}
                    >
                      <td className="px-3 py-3 text-gray-800">
                        {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {formatDate(order.created_at)}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs">
                        {order.order_number}
                      </td>
                      <td className="px-4 py-3 max-w-xs">
                        {order.items.map((item, i) => (
                          <div key={i} className={lineClass(i)}>
                            {item.product_name}
                            <span className="ml-1">×{item.quantity}</span>
                          </div>
                        ))}
                      </td>
                      <td className="px-4 py-3 text-right font-mono whitespace-nowrap">
                        {order.items.map((item, i) => (
                          <div key={i} className={lineClass(i)}>
                            {formatIDR(item.selling_price)}
                          </div>
                        ))}
                      </td>
                      <td className="px-4 py-3 text-right font-mono whitespace-nowrap">
                        {order.items.map((item, i) => (
                          <div key={i} className={lineClass(i)}>
                            {item.base_price != null ? formatIDR(item.base_price) : "-"}
                          </div>
                        ))}
                      </td>
                      <td className="px-4 py-3 text-right font-mono whitespace-nowrap">
                        {order.items.map((item, i) => (
                          <div key={i} className={lineClass(i)}>
                            {item.admin_fee > 0 ? formatIDR(item.admin_fee) : "-"}
                          </div>
                        ))}
                      </td>
                      <td className="px-4 py-3 text-right font-mono whitespace-nowrap">
                        {order.items.map((item, i) => (
                          <div key={i} className={`${lineClass(i)} ${marginColor(item.margin)}`}>
                            {item.margin != null ? formatIDR(item.margin) : "-"}
                          </div>
                        ))}
                      </td>
                    </tr>

                    {isOpen && (
                      <tr className="border-t border-gray-100">
                        <td colSpan={8} className="bg-gray-50 px-6 py-4">
                          <OrderDetail order={order} />
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function OrderDetail({ order }: { order: EnrichedOrder }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-x-8 gap-y-3 text-sm">
      <DetailField label="Order Time" value={formatDatetime(order.created_at)} />
      <DetailField label="Payment" value={order.payment_method} />
      <DetailField label="Username" value={order.buyer_username} />
      <DetailField label="City" value={order.city} />
      <DetailField label="Province" value={order.province} />

      {order.items.length > 0 && (
        <div className="col-span-full mt-2 pt-2 border-t border-gray-200">
          <p className="text-xs font-medium text-gray-800 mb-2">Parent SKU per Item</p>
          <div className="flex flex-wrap gap-3">
            {order.items.map((item, i) => (
              <div key={i} className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs">
                <p className="font-mono text-gray-900">{item.parent_sku || "-"}</p>
                <p className="text-gray-800 mt-0.5 truncate max-w-[200px]">{item.product_name}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function DetailField({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <p className="text-xs text-gray-800 font-medium">{label}</p>
      <p className="text-gray-900">{value || "-"}</p>
    </div>
  );
}

function lineClass(index: number): string {
  return index > 0 ? "mt-1 pt-1 border-t border-gray-100" : "";
}

function marginColor(margin: number | null): string {
  if (margin == null) return "";
  return margin >= 0 ? "text-green-700" : "text-red-600";
}

function formatIDR(n: number): string {
  return "Rp " + Number(n).toLocaleString("id-ID");
}

function formatDate(iso: string): string {
  if (!iso) return "-";
  const d = new Date(iso);
  return d.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatDatetime(iso: string): string {
  if (!iso) return "-";
  const d = new Date(iso);
  return d.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
