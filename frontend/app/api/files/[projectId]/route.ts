import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type FileNode = {
  name: string;
  path: string;
  type: "file" | "folder";
  content?: string;
  language?: string;
  children?: FileNode[];
};

function buildFileTree(files: { path: string; content: string; language: string | null }[]): FileNode[] {
  const root: FileNode[] = [];

  for (const file of files) {
    const parts = file.path.split("/");
    let current = root;

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const isLast = i === parts.length - 1;
      const existingDir = current.find((n) => n.name === part && n.type === "folder");

      if (isLast) {
        current.push({
          name: part,
          path: file.path,
          type: "file",
          content: file.content,
          language: file.language ?? "plaintext",
        });
      } else if (existingDir) {
        current = existingDir.children!;
      } else {
        const dir: FileNode = {
          name: part,
          path: parts.slice(0, i + 1).join("/"),
          type: "folder",
          children: [],
        };
        current.push(dir);
        current = dir.children!;
      }
    }
  }

  return root;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
  
    const { projectId } = await params;

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { files: { orderBy: { path: "asc" } } },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const files = buildFileTree(project.files);
    return NextResponse.json({ files });
  } catch (err) {
    console.error("GET /api/files/[projectId] error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}