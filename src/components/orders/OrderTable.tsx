"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Package, ChevronDown, ChevronRight, Trash2, Calendar,
  Loader2, AlertTriangle, RefreshCw, Plus, Pencil, ChevronLeft, Upload,
} from "lucide-react";
import { pruneOrders, recalculateOrders } from "@/app/dashboard/orders/actions";
import ManualOrderForm from "./ManualOrderForm";
import OrderEditModal from "./OrderEditModal";
import ImportModal from "./ImportModal";

// ─── Types ───────────────────────────────────────────────────────

interface EnrichedItem {
  product_name: string;
  parent_sku: string;
  variation_name: string | null;
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

interface SKU {
  id: string;
  name: string;
  variations: { id: string; variation_name: string }[];
}

interface OrderTableProps {
  orders: EnrichedOrder[];
  skus: SKU[];
}

// ─── Date range helpers ──────────────────────────────────────────

type DatePreset = "all" | "today" | "yesterday" | "week" | "month" | "last30" | "custom";

function getDateRange(preset: DatePreset): { from: Date; to: Date } | null {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  switch (preset) {
    case "today":
      return { from: today, to: new Date(today.getTime() + 86400000) };
    case "yesterday": {
      const y = new Date(today.getTime() - 86400000);
      return { from: y, to: today };
    }
    case "week": {
      const from = new Date(today.getTime() - 6 * 86400000);
      return { from, to: new Date(today.getTime() + 86400000) };
    }
    case "month": {
      const from = new Date(now.getFullYear(), now.getMonth(), 1);
      return { from, to: new Date(today.getTime() + 86400000) };
    }
    case "last30": {
      const from = new Date(today.getTime() - 29 * 86400000);
      return { from, to: new Date(today.getTime() + 86400000) };
    }
    default:
      return null;
  }
}

// ─── Component ───────────────────────────────────────────────────

export default function OrderTable({ orders, skus }: OrderTableProps) {
  const router = useRouter();

  // Filter states
  const [datePreset, setDatePreset] = useState<DatePreset>("all");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [search, setSearch] = useState("");
  const [productFilter, setProductFilter] = useState("");
  const [variationFilter, setVariationFilter] = useState("");

  // Pagination
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(20);

  // UI states
  const [expanded, setExpanded] = useState<string | null>(null);
  const [showPrune, setShowPrune] = useState(false);
  const [showManualForm, setShowManualForm] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [editOrder, setEditOrder] = useState<EnrichedOrder | null>(null);
  const [pruneFrom, setPruneFrom] = useState("");
  const [pruneTo, setPruneTo] = useState("");
  const [pruning, setPruning] = useState(false);
  const [confirmAll, setConfirmAll] = useState(false);
  const [confirmRange, setConfirmRange] = useState(false);
  const [pruneError, setPruneError] = useState<string | null>(null);
  const [recalculating, setRecalculating] = useState(false);
  const [recalcResult, setRecalcResult] = useState<string | null>(null);

  // ─── Derived filter options ──────────────────────────────────

  const uniqueProducts = useMemo(() => {
    const set = new Set<string>();
    orders.forEach((o) => o.items.forEach((i) => { if (i.product_name) set.add(i.product_name); }));
    return [...set].sort();
  }, [orders]);

  const uniqueVariations = useMemo(() => {
    const set = new Set<string>();
    const filtered = productFilter
      ? orders.filter((o) => o.items.some((i) => i.product_name === productFilter))
      : orders;
    filtered.forEach((o) => o.items.forEach((i) => { if (i.variation_name) set.add(i.variation_name); }));
    return [...set].sort();
  }, [orders, productFilter]);

  // ─── Filtered + paginated data ────────────────────────────────

  const filtered = useMemo(() => {
    let result = orders;

    // Date filter
    if (datePreset === "custom" && customFrom && customTo) {
      const from = new Date(customFrom);
      const to = new Date(customTo + "T23:59:59");
      result = result.filter((o) => {
        const d = new Date(o.created_at);
        return d >= from && d <= to;
      });
    } else {
      const range = getDateRange(datePreset);
      if (range) {
        result = result.filter((o) => {
          const d = new Date(o.created_at);
          return d >= range.from && d < range.to;
        });
      }
    }

    // Search (order number + username)
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (o) =>
          o.order_number.toLowerCase().includes(q) ||
          (o.buyer_username && o.buyer_username.toLowerCase().includes(q))
      );
    }

    // Product filter
    if (productFilter) {
      result = result.filter((o) => o.items.some((i) => i.product_name === productFilter));
    }

    // Variation filter
    if (variationFilter) {
      result = result.filter((o) => o.items.some((i) => i.variation_name === variationFilter));
    }

    return result;
  }, [orders, datePreset, customFrom, customTo, search, productFilter, variationFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const safePage = Math.min(page, totalPages);
  const paged = filtered.slice((safePage - 1) * perPage, safePage * perPage);

  // Reset page when filters change
  function resetPage() { setPage(1); }

  // ─── Actions ──────────────────────────────────────────────────

  async function handlePruneAll() {
    setPruning(true);
    setPruneError(null);
    const res = await pruneOrders("all");
    if (res.error) { setPruneError(res.error); setPruning(false); }
    else { setPruning(false); setConfirmAll(false); setShowPrune(false); router.refresh(); }
  }

  async function handlePruneRange() {
    if (!pruneFrom || !pruneTo) return;
    setPruning(true);
    setPruneError(null);
    const res = await pruneOrders("range", pruneFrom, pruneTo);
    if (res.error) { setPruneError(res.error); setPruning(false); }
    else { setPruning(false); setConfirmRange(false); setShowPrune(false); router.refresh(); }
  }

  async function handleRecalculate() {
    setRecalculating(true);
    setRecalcResult(null);
    try {
      const res = await recalculateOrders();
      setRecalculating(false);
      setRecalcResult(res.updated > 0
        ? `Updated ${res.updated} of ${res.total} order items with latest SKU data.`
        : "All order items are already up to date.");
      router.refresh();
    } catch {
      setRecalculating(false);
      setRecalcResult("Error: Failed to recalculate orders.");
    }
  }

  // ─── Shared class strings ────────────────────────────────────

  const inputCls = "bg-[var(--surface)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent";
  const selectCls = "bg-[var(--surface)] border border-[var(--border)] rounded-lg px-2 py-2 text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]";
  const btnBase = "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-[var(--transition-fast)] disabled:opacity-50";

  const datePill = (value: DatePreset, label: string) => (
    <button
      key={value}
      onClick={() => { setDatePreset(value); resetPage(); }}
      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
        datePreset === value
          ? "bg-[var(--primary)] text-white"
          : "bg-[var(--surface)] border border-[var(--border)] text-[var(--foreground-secondary)] hover:bg-[var(--surface-hover)]"
      }`}
    >
      {label}
    </button>
  );

  // ─── Render ───────────────────────────────────────────────────

  return (
    <div>
      {/* ── Filter bar ─────────────────────────────────────── */}
      <div className="mb-4 space-y-3">
        {/* Row 1: Search + actions */}
        <div className="flex items-center gap-2 flex-wrap">
          <input
            type="text"
            placeholder="Search order # or username..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); resetPage(); }}
            className={`flex-1 min-w-[160px] max-w-sm ${inputCls}`}
          />
          <select value={productFilter} onChange={(e) => { setProductFilter(e.target.value); setVariationFilter(""); resetPage(); }} className={`${selectCls} min-w-[140px]`}>
            <option value="">All Products</option>
            {uniqueProducts.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
          <select value={variationFilter} onChange={(e) => { setVariationFilter(e.target.value); resetPage(); }} className={`${selectCls} min-w-[140px]`}>
            <option value="">All Variations</option>
            {uniqueVariations.map((v) => <option key={v} value={v}>{v}</option>)}
          </select>
          <button onClick={() => setShowImport(true)} className={`${btnBase} border border-[var(--border-strong)] text-[var(--foreground-secondary)] bg-transparent hover:bg-[var(--surface-hover)]`}>
            <Upload size={14} /><span className="hidden sm:inline">Import XLSX</span>
          </button>
          <button onClick={() => setShowManualForm(true)} className={`${btnBase} bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)]`}>
            <Plus size={14} /><span className="hidden sm:inline">Manual Order</span><span className="sm:hidden">Add</span>
          </button>
          <button onClick={handleRecalculate} disabled={recalculating} className={`${btnBase} border border-[var(--primary)] text-[var(--primary)] bg-transparent hover:bg-[var(--primary-light)]`}>
            <RefreshCw size={14} className={recalculating ? "animate-spin" : ""} />
            <span className="hidden md:inline">{recalculating ? "Recalculating..." : "Recalculate"}</span>
          </button>
          <button onClick={() => { setShowPrune(!showPrune); setConfirmAll(false); setConfirmRange(false); setPruneError(null); }} className={`${btnBase} border border-[var(--danger)] text-[var(--danger)] bg-transparent hover:bg-[var(--danger-light)]`}>
            <Trash2 size={14} /><span className="hidden md:inline">Prune</span>
          </button>
        </div>

        {/* Row 2: Date pills + custom range */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs font-medium text-[var(--foreground-secondary)] mr-1 whitespace-nowrap">Period:</span>
          {datePill("all", "All")}
          {datePill("today", "Today")}
          {datePill("yesterday", "Yesterday")}
          {datePill("week", "7 Days")}
          {datePill("month", "This Month")}
          {datePill("last30", "Last 30 Days")}
          {datePill("custom", "Custom")}
          {datePreset === "custom" && (
            <>
              <input
                type="date"
                value={customFrom}
                onChange={(e) => { setCustomFrom(e.target.value); resetPage(); }}
                className={`${inputCls} [color-scheme:light] dark:[color-scheme:dark] text-xs px-2 py-1.5`}
                placeholder="From"
              />
              <span className="text-xs text-[var(--muted)]">to</span>
              <input
                type="date"
                value={customTo}
                onChange={(e) => { setCustomTo(e.target.value); resetPage(); }}
                className={`${inputCls} [color-scheme:light] dark:[color-scheme:dark] text-xs px-2 py-1.5`}
                placeholder="To"
              />
            </>
          )}
        </div>
      </div>

      {/* Recalculate result */}
      {recalcResult && (
        <div className={`mb-4 p-3 rounded-lg text-sm flex items-center gap-2 ${
          recalcResult.startsWith("Error")
            ? "bg-[var(--danger-light)] border border-[var(--danger)] text-[var(--danger)]"
            : "bg-[var(--accent-light)] border border-[var(--accent)] text-[var(--accent)]"
        }`}>
          {recalcResult.startsWith("Error") ? <AlertTriangle size={14} /> : <RefreshCw size={14} />}
          {recalcResult}
        </div>
      )}

      {/* Prune panel */}
      {showPrune && (
        <div className="mb-4 bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4 md:p-5">
          <div className="flex items-center gap-2 mb-4">
            <Calendar size={16} className="text-[var(--foreground)]" />
            <span className="text-sm font-medium text-[var(--foreground)]">Prune Order Data</span>
          </div>
          {pruneError && (
            <div className="mb-4 p-3 bg-[var(--danger-light)] border border-[var(--danger)] rounded-lg text-sm text-[var(--danger)] flex items-center gap-2">
              <AlertTriangle size={14} />{pruneError}
            </div>
          )}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-[var(--surface-hover)] rounded-lg mb-3 gap-3">
            <div>
              <p className="text-sm font-medium text-[var(--foreground)]">Delete All Orders</p>
              <p className="text-xs text-[var(--muted)]">{orders.length} orders will be permanently deleted</p>
            </div>
            {confirmAll ? (
              <div className="flex items-center gap-2">
                <span className="text-xs text-[var(--danger)] font-medium">Are you sure?</span>
                <button onClick={handlePruneAll} disabled={pruning} className="px-3 py-1.5 bg-[var(--danger)] text-white rounded-md text-xs hover:opacity-90 disabled:opacity-50 flex items-center gap-1">
                  {pruning && <Loader2 size={12} className="animate-spin" />}Yes, Delete
                </button>
                <button onClick={() => setConfirmAll(false)} className="px-3 py-1.5 border border-[var(--border)] rounded-md text-xs text-[var(--foreground-secondary)] hover:bg-[var(--surface)]">Cancel</button>
              </div>
            ) : (
              <button onClick={() => setConfirmAll(true)} className="px-3 py-1.5 bg-[var(--danger)] text-white rounded-md text-xs hover:opacity-90">Delete All</button>
            )}
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 bg-[var(--surface-hover)] rounded-lg">
            <div className="flex-1">
              <p className="text-sm font-medium text-[var(--foreground)] mb-2">Delete by Date Range</p>
              <div className="flex items-center gap-2">
                <input type="date" value={pruneFrom} onChange={(e) => setPruneFrom(e.target.value)} className={`${inputCls} [color-scheme:light] dark:[color-scheme:dark] text-xs px-2 py-1.5`} />
                <span className="text-xs text-[var(--muted)]">to</span>
                <input type="date" value={pruneTo} onChange={(e) => setPruneTo(e.target.value)} className={`${inputCls} [color-scheme:light] dark:[color-scheme:dark] text-xs px-2 py-1.5`} />
              </div>
            </div>
            {confirmRange ? (
              <div className="flex items-center gap-2">
                <span className="text-xs text-[var(--danger)] font-medium">Are you sure?</span>
                <button onClick={handlePruneRange} disabled={pruning || !pruneFrom || !pruneTo} className="px-3 py-1.5 bg-[var(--danger)] text-white rounded-md text-xs hover:opacity-90 disabled:opacity-50 flex items-center gap-1">
                  {pruning && <Loader2 size={12} className="animate-spin" />}Yes, Delete
                </button>
                <button onClick={() => setConfirmRange(false)} className="px-3 py-1.5 border border-[var(--border)] rounded-md text-xs text-[var(--foreground-secondary)] hover:bg-[var(--surface)]">Cancel</button>
              </div>
            ) : (
              <button onClick={() => { if (pruneFrom && pruneTo) setConfirmRange(true); }} disabled={!pruneFrom || !pruneTo} className="px-3 py-1.5 bg-[var(--danger)] text-white rounded-md text-xs hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed">Delete Range</button>
            )}
          </div>
        </div>
      )}

      {/* ── Results count + per-page ─────────────────────── */}
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs text-[var(--muted)]">
          Showing {paged.length} of {filtered.length} orders
          {filtered.length !== orders.length && ` (filtered from ${orders.length})`}
        </p>
        <div className="flex items-center gap-2">
          <span className="text-xs text-[var(--muted)]">Per page:</span>
          <select value={perPage} onChange={(e) => { setPerPage(Number(e.target.value)); resetPage(); }} className={`${selectCls} text-xs px-2 py-1`}>
            {[10, 20, 30, 40, 50, 100].map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>
      </div>

      {/* ── Table ────────────────────────────────────────── */}
      {paged.length === 0 ? (
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-12 text-center">
          <Package size={48} className="mx-auto text-[var(--muted)] mb-4" />
          <p className="text-[var(--foreground-secondary)]">No orders match your filters</p>
        </div>
      ) : (
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl overflow-x-auto">
          <table className="w-full text-sm text-[var(--foreground)]">
            <thead className="bg-[var(--surface-hover)]">
              <tr>
                <th className="w-8 px-3 py-3"></th>
                <th className="text-left px-4 py-3 font-medium text-[var(--foreground-secondary)]">Date</th>
                <th className="text-left px-4 py-3 font-medium text-[var(--foreground-secondary)]">Order #</th>
                <th className="text-left px-4 py-3 font-medium text-[var(--foreground-secondary)] hidden sm:table-cell">Product</th>
                <th className="text-left px-4 py-3 font-medium text-[var(--foreground-secondary)] hidden md:table-cell">Variation</th>
                <th className="text-right px-4 py-3 font-medium text-[var(--foreground-secondary)]">Selling Price</th>
                <th className="text-right px-4 py-3 font-medium text-[var(--foreground-secondary)] hidden lg:table-cell">Base Price</th>
                <th className="text-right px-4 py-3 font-medium text-[var(--foreground-secondary)] hidden lg:table-cell">Admin Fee</th>
                <th className="text-right px-4 py-3 font-medium text-[var(--foreground-secondary)]">Margin</th>
                <th className="w-10 px-2 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {paged.map((order) => {
                const isOpen = expanded === order.id;
                return (
                  <React.Fragment key={order.id}>
                    <tr className="border-t border-[var(--border)] hover:bg-[var(--surface-hover)] cursor-pointer" onClick={() => setExpanded(isOpen ? null : order.id)}>
                      <td className="px-3 py-3 text-[var(--muted)]">
                        {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">{formatDate(order.created_at)}</td>
                      <td className="px-4 py-3 font-mono text-xs">{order.order_number}</td>
                      <td className="px-4 py-3 max-w-xs hidden sm:table-cell">
                        {order.items.map((item, i) => (
                          <div key={i} className={lineClass(i)}>
                            {item.product_name}<span className="ml-1 text-[var(--muted)]">&times;{item.quantity}</span>
                          </div>
                        ))}
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        {order.items.map((item, i) => (
                          <div key={i} className={lineClass(i)}>
                            {item.variation_name || <span className="text-[var(--muted)]">-</span>}
                          </div>
                        ))}
                      </td>
                      <td className="px-4 py-3 text-right font-mono whitespace-nowrap">
                        {order.items.map((item, i) => <div key={i} className={lineClass(i)}>{formatIDR(item.selling_price)}</div>)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono whitespace-nowrap hidden lg:table-cell">
                        {order.items.map((item, i) => <div key={i} className={lineClass(i)}>{item.base_price != null ? formatIDR(item.base_price) : <span className="text-[var(--muted)]">-</span>}</div>)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono whitespace-nowrap hidden lg:table-cell">
                        {order.items.map((item, i) => <div key={i} className={lineClass(i)}>{item.admin_fee > 0 ? formatIDR(item.admin_fee) : <span className="text-[var(--muted)]">-</span>}</div>)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono whitespace-nowrap">
                        {order.items.map((item, i) => (
                          <div key={i} className={`${lineClass(i)} ${marginColor(item.margin)}`}>
                            {item.margin != null ? formatIDR(item.margin) : <span className="text-[var(--muted)]">-</span>}
                          </div>
                        ))}
                      </td>
                      <td className="px-2 py-3" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => setEditOrder(order)}
                          className="p-1.5 text-[var(--muted)] hover:text-[var(--primary)] rounded-md hover:bg-[var(--primary-light)]"
                          title="Edit order"
                        >
                          <Pencil size={14} />
                        </button>
                      </td>
                    </tr>
                    {isOpen && (
                      <tr className="border-t border-[var(--border)]">
                        <td colSpan={10} className="bg-[var(--surface-hover)] px-6 py-4">
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

      {/* ── Pagination ───────────────────────────────────── */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <button
            onClick={() => setPage(Math.max(1, safePage - 1))}
            disabled={safePage <= 1}
            className={`${btnBase} border border-[var(--border)] text-[var(--foreground-secondary)] hover:bg-[var(--surface-hover)] disabled:opacity-30`}
          >
            <ChevronLeft size={14} /> Prev
          </button>
          <div className="flex items-center gap-1">
            {paginationRange(safePage, totalPages).map((p, i) =>
              p === "..." ? (
                <span key={`dots-${i}`} className="px-2 text-[var(--muted)] text-xs">...</span>
              ) : (
                <button
                  key={p}
                  onClick={() => setPage(p as number)}
                  className={`w-8 h-8 rounded-lg text-xs font-medium transition-colors ${
                    safePage === p
                      ? "bg-[var(--primary)] text-white"
                      : "text-[var(--foreground-secondary)] hover:bg-[var(--surface-hover)]"
                  }`}
                >
                  {p}
                </button>
              )
            )}
          </div>
          <button
            onClick={() => setPage(Math.min(totalPages, safePage + 1))}
            disabled={safePage >= totalPages}
            className={`${btnBase} border border-[var(--border)] text-[var(--foreground-secondary)] hover:bg-[var(--surface-hover)] disabled:opacity-30`}
          >
            Next <ChevronRight size={14} />
          </button>
        </div>
      )}

      {/* ── Modals ───────────────────────────────────────── */}
      {showImport && (
        <ImportModal onClose={() => { setShowImport(false); router.refresh(); }} />
      )}
      {showManualForm && (
        <ManualOrderForm skus={skus} onClose={() => { setShowManualForm(false); router.refresh(); }} />
      )}
      {editOrder && (
        <OrderEditModal
          order={{
            id: editOrder.id,
            order_number: editOrder.order_number,
            payment_method: editOrder.payment_method || "",
            buyer_username: editOrder.buyer_username || "",
            city: editOrder.city || "",
            province: editOrder.province || "",
            items: editOrder.items.map((i) => ({
              product_name: i.product_name,
              variation_name: i.variation_name || "",
              parent_sku: i.parent_sku,
              discounted_price: i.selling_price,
              quantity: i.quantity,
            })),
          }}
          skus={skus}
          onClose={() => { setEditOrder(null); router.refresh(); }}
        />
      )}
    </div>
  );
}

// ─── Sub-components ──────────────────────────────────────────────

function OrderDetail({ order }: { order: EnrichedOrder }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-x-8 gap-y-3 text-sm">
      <DetailField label="Order Time" value={formatDatetime(order.created_at)} />
      <DetailField label="Payment" value={order.payment_method} />
      <DetailField label="Username" value={order.buyer_username} />
      <DetailField label="City" value={order.city} />
      <DetailField label="Province" value={order.province} />
      {order.items.length > 0 && (
        <div className="col-span-full mt-2 pt-2 border-t border-[var(--border)]">
          <p className="text-xs font-medium text-[var(--foreground-secondary)] mb-2">Parent SKU per Item</p>
          <div className="flex flex-wrap gap-3">
            {order.items.map((item, i) => (
              <div key={i} className="bg-[var(--surface)] border border-[var(--border)] rounded-lg px-3 py-2 text-xs">
                <p className="font-mono text-[var(--foreground)]">{item.parent_sku || "-"}</p>
                <p className="text-[var(--muted)] mt-0.5 truncate max-w-[200px]">{item.product_name}</p>
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
      <p className="text-xs text-[var(--foreground-secondary)] font-medium">{label}</p>
      <p className="text-[var(--foreground)]">{value || "-"}</p>
    </div>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────

function lineClass(index: number): string {
  return index > 0 ? "mt-1 pt-1 border-t border-[var(--border)]" : "";
}

function marginColor(margin: number | null): string {
  if (margin == null) return "";
  return margin >= 0 ? "text-[var(--accent)]" : "text-[var(--danger)]";
}

function formatIDR(n: number): string {
  return "Rp " + Number(n).toLocaleString("id-ID");
}

function formatDate(iso: string): string {
  if (!iso) return "-";
  return new Date(iso).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
}

function formatDatetime(iso: string): string {
  if (!iso) return "-";
  return new Date(iso).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function paginationRange(current: number, total: number): (number | "...")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages: (number | "...")[] = [1];
  if (current > 3) pages.push("...");
  for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) pages.push(i);
  if (current < total - 2) pages.push("...");
  pages.push(total);
  return pages;
}
