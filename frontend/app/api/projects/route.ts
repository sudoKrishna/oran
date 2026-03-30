import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { TEMPLATE_FILES } from "@/lib/templates";
import GetUserFromRequest from "@/lib/auth";

const ALLOWED_TEMPLATES = ["node", "typescript", "react", "nextjs"];

export async function POST(req: NextRequest) {
  try {
    const user = await GetUserFromRequest();
    if (!user || typeof user === "string" || !("id" in user)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name, template } = await req.json();

    if (!name || !template) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    if (!ALLOWED_TEMPLATES.includes(template)) {
      return NextResponse.json(
        { error: `Invalid template. Allowed: ${ALLOWED_TEMPLATES.join(", ")}` },
        { status: 400 }
      );
    }

    const files = TEMPLATE_FILES[template as keyof typeof TEMPLATE_FILES];
    if (!files) {
      return NextResponse.json({ error: "Template files not found" }, { status: 400 });
    }

    const project = await prisma.project.create({
      data: {
        name,
        template,
        owner: {
          connect: { id: user.id },
        },
        files: {
          create: files.map((f) => ({
            path: f.path,
            content: f.content,
            language: f.language,
          })),
        },
      },
      include: { files: true },
    });

    return NextResponse.json({ projectId: project.id });
  } catch (err) {
    console.error("POST /api/projects error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}