import { NextRequest, NextResponse } from "next/server";
import { confirmImport } from "@/app/dashboard/import/actions";

export async function POST(request: NextRequest) {
  const data = await request.text();
  const result = await confirmImport(data);

  if ("error" in result) {
    return NextResponse.json(result, { status: 500 });
  }

  return NextResponse.json(result);
}
