import { prisma } from "@/lib/prisma";
import { comparePassword } from "@/lib/hash";
import { signToken } from "@/lib/jwt";
import { cookies } from "next/headers";

export async function POST(req: Request) {
  const body = await req.json();

  const user = await prisma.user.findUnique({
    where: { email: body.email },
  });

  if (!user) {
    return new Response("Invalid credentials", { status: 401 });
  }

  // ← this was missing before
  const isValid = await comparePassword(body.password, user.password);
  if (!isValid) {
    return new Response("Invalid credentials", { status: 401 });
  }

  const token = signToken({ id: user.id, name: user.name, email: user.email });

  const cookieStore = await cookies();
  cookieStore.set("token", token, {
    httpOnly: true,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 7, 
  });

  return Response.json({ message: "Logged in" });
}