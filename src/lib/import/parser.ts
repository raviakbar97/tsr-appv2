import * as XLSX from "xlsx";

export interface RawOrderRow {
  orderNumber: string;
  orderStatus: string;
  trackingNumber: string;
  shippingOption: string;
  createdAt: string;
  paidAt: string;
  paymentMethod: string;
  parentSku: string;
  productName: string;
  skuReference: string;
  variationName: string;
  originalPrice: number;
  discountedPrice: number;
  quantity: number;
  buyerPaid: number;
  totalDiscount: number;
  sellerDiscount: number;
  shopeeDiscount: number;
  productWeight: string;
  buyerShippingCost: number;
  estimatedShippingCost: number;
  totalPayment: number;
  estimatedShipping: number;
  buyerUsername: string;
  city: string;
  province: string;
  completedAt: string;
  cancellationReason: string;
  buyerNote: string;
}

/** Strip dots from Shopee's IDR format: "17.000" → 17000 */
export function parseIDR(value: string | number | undefined): number {
  if (value === undefined || value === null || value === "") return 0;
  const str = String(value).trim();
  if (!str) return 0;
  // Remove dots (thousands separator) and parse
  const cleaned = str.replace(/\./g, "").replace(/,/g, ".");
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

/** Parse Shopee date: "2026-04-04 06:00" → ISO string */
export function parseShopeeDate(value: string | number | undefined): string {
  if (!value) return "";
  const str = String(value).trim();
  if (!str) return "";
  // Handle Excel serial date numbers
  if (typeof value === "number") {
    const date = XLSX.SSF.parse_date_code(value);
    if (date) {
      const d = new Date(date.y, date.m - 1, date.d, date.H || 0, date.M || 0, date.S || 0);
      return d.toISOString();
    }
  }
  // Handle string dates: "2026-04-04 06:00"
  const match = str.match(/^(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2})/);
  if (match) {
    const [, y, mo, d, h, mi] = match;
    return new Date(+y, +mo - 1, +d, +h, +mi).toISOString();
  }
  // Try native parse as fallback
  const d = new Date(str);
  return isNaN(d.getTime()) ? "" : d.toISOString();
}

/** Safely get a cell value as trimmed string */
function cell(row: Record<string, unknown>, key: string): string {
  const val = row[key];
  if (val === undefined || val === null) return "";
  return String(val).trim();
}

/** Parse an xlsx file buffer into typed order rows */
export function parseXlsx(buffer: ArrayBuffer): RawOrderRow[] {
  const workbook = XLSX.read(buffer, { type: "array" });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const jsonRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet);

  return jsonRows.map((row) => {
    const get = (key: string): string | number | undefined => {
      const val = row[key];
      if (val === undefined || val === null) return undefined;
      return typeof val === "number" ? val : String(val);
    };

    return {
    orderNumber: cell(row, "No. Pesanan"),
    orderStatus: cell(row, "Status Pesanan"),
    trackingNumber: cell(row, "No. Resi"),
    shippingOption: cell(row, "Opsi Pengiriman"),
    createdAt: parseShopeeDate(get("Waktu Pesanan Dibuat")),
    paidAt: parseShopeeDate(get("Waktu Pembayaran Dilakukan")),
    paymentMethod: cell(row, "Metode Pembayaran"),
    parentSku: cell(row, "SKU Induk"),
    productName: cell(row, "Nama Produk"),
    skuReference: cell(row, "Nomor Referensi SKU"),
    variationName: cell(row, "Nama Variasi"),
    originalPrice: parseIDR(get("Harga Awal")),
    discountedPrice: parseIDR(get("Harga Setelah Diskon")),
    quantity: parseInt(cell(row, "Jumlah")) || 1,
    buyerPaid: parseIDR(get("Dibayar Pembeli")),
    totalDiscount: parseIDR(get("Total Diskon")),
    sellerDiscount: parseIDR(get("Diskon Dari Penjual")),
    shopeeDiscount: parseIDR(get("Diskon Dari Shopee")),
    productWeight: cell(row, "Berat Produk"),
    buyerShippingCost: parseIDR(get("Ongkos Kirim Dibayar oleh Pembeli")),
    estimatedShippingCost: parseIDR(get("Estimasi Potongan Biaya Pengiriman")),
    totalPayment: parseIDR(get("Total Pembayaran")),
    estimatedShipping: parseIDR(get("Perkiraan Ongkos Kirim")),
    buyerUsername: cell(row, "Username (Pembeli)"),
    city: cell(row, "Kota/Kabupaten"),
    province: cell(row, "Provinsi"),
    completedAt: parseShopeeDate(get("Waktu Pesanan Selesai")),
    cancellationReason: cell(row, "Alasan Pembatalan"),
    buyerNote: cell(row, "Catatan dari Pembeli"),
  };
  });
}
