import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import path from "path";

function inferLanguage(filePath: string): string {
    const ext = path.extname(filePath).toLowerCase();
    const map: Record<string, string> = {
        ".ts": "typescript",
        ".tsx": "typescript",
        ".js": "javascript",
        ".jsx": "javascript",
        ".json": "json",
        ".css": "css",
        ".html": "html",
        ".md": "markdown",
    };
    return map[ext] ?? "plaintext";
}

// PUT  upsert file content
export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ projectId: string; filePath: string[] }> }
) {
    try {
       
        const { projectId, filePath: filePathParts } = await params;
        const filePath = filePathParts.join("/");

        const project = await prisma.project.findUnique({ where: { id: projectId } });
        if (!project) {
            return NextResponse.json({ error: "Project not found" }, { status: 404 });
        }

        const { content } = await req.json();
        if (typeof content !== "string") {
            return NextResponse.json({ error: "content must be a string" }, { status: 400 });
        }

        await prisma.file.upsert({
            where: { projectId_path: { projectId, path: filePath } },
            update: { content, language: inferLanguage(filePath) },
            create: {
                projectId,
                path: filePath,
                content,
                language: inferLanguage(filePath),
            },
        });

        return NextResponse.json({ ok: true });
    } catch (err) {
        console.error("PUT /api/files error:", err);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}

//  delete a file
export async function DELETE(
    _req: NextRequest,
    { params }: { params: Promise<{ projectId: string; filePath: string[] }> }
) {
    try {
        
        const { projectId, filePath: filePathParts } = await params;
        const filePath = filePathParts.join("/");

        await prisma.file.delete({
            where: { projectId_path: { projectId, path: filePath } },
        });

        return NextResponse.json({ ok: true });
    } catch (err) {
        console.error("DELETE /api/files error:", err);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}