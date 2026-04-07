"use client";

import { useRef, useState } from "react";
import { Upload, FileSpreadsheet, Loader2 } from "lucide-react";

interface UploadZoneProps {
  onParsed: (result: {
    orderCount: number;
    itemCount: number;
    skippedCount: number;
    orders: { order_number: string; order_status: string; total_payment: number; created_at: string; buyer_username: string | null; city: string | null }[];
    items: { order_number: string; parent_sku: string; product_name: string; variation_name: string | null; quantity: number; buyer_paid: number }[];
  }) => void;
}

export default function UploadZone({ onParsed }: UploadZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  async function handleFile(file: File) {
    if (!file.name.endsWith(".xlsx") && !file.name.endsWith(".xls")) {
      setError("Please upload an .xlsx or .xls file");
      return;
    }

    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/import/parse", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (data.error) {
        setError(data.error);
      } else {
        onParsed(data);
      }
    } catch {
      setError("Failed to parse file");
    } finally {
      setLoading(false);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  return (
    <div>
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={`
          border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-colors
          ${dragOver ? "border-[var(--primary)] bg-[var(--primary-light)]" : "border-[var(--border-strong)] hover:border-[var(--border-strong)]"}
        `}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".xlsx,.xls"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
          }}
        />

        {loading ? (
          <Loader2 size={48} className="mx-auto text-blue-500 mb-4 animate-spin" />
        ) : (
          <FileSpreadsheet size={48} className="mx-auto text-[var(--muted)] mb-4" />
        )}

        <h3 className="text-lg font-medium text-[var(--foreground)] mb-1">
          {loading ? "Parsing file..." : "Upload XLSX"}
        </h3>
        <p className="text-sm text-[var(--foreground-secondary)]">
          Drag & drop or click to select a Shopee order export file
        </p>
        <div className="mt-2 flex items-center justify-center gap-2">
          <Upload size={14} className="text-[var(--muted)]" />
          <span className="text-xs text-[var(--muted)]">.xlsx, .xls</span>
        </div>
      </div>

      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error}
        </div>
      )}
    </div>
  );
}
