import { NextResponse } from "next/server";
import GetUserFromRequest from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const payload = await GetUserFromRequest();
  if (!payload || typeof payload === "string") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: (payload as any).id },
    select: { id: true, name: true, email: true },
  });

  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(user);
}