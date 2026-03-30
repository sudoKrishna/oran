import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import GetUserFromRequest from "@/lib/auth";

export async function GET() {
  const user = await GetUserFromRequest();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const token = (await cookies()).get("token")?.value;
  return NextResponse.json({ token });
}