import { NextRequest, NextResponse } from "next/server";
import { parseXlsx } from "@/lib/import/parser";
import { mapRowsToOrders } from "@/lib/import/mapper";

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const file = formData.get("file") as File;

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  const buffer = await file.arrayBuffer();
  const rows = parseXlsx(buffer);

  if (rows.length === 0) {
    return NextResponse.json({ error: "No rows found in file" }, { status: 400 });
  }

  const { orders, items, skippedCount } = mapRowsToOrders(rows);

  return NextResponse.json({
    orderCount: orders.size,
    itemCount: items.length,
    skippedCount,
    orders: Array.from(orders.values()),
    items,
  });
}
