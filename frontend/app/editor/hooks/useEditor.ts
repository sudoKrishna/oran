"use client";

import { useState, useRef, useCallback } from "react";
import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";
import { MonacoBinding } from "y-monaco";
import { OpenFile, FileNode, ActiveUser } from "../types";
import { getLanguage } from "../lib/utils";

// ─── useEditorFiles ────────────────────────────────────────────────────────────
// Manages open files, active file, dirty state, and save logic.

export function useEditorFiles(projectId: string) {
  const [openFiles, setOpenFiles] = useState<OpenFile[]>([]);
  const [activeFile, setActiveFile] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "unsaved">("saved");
  const saveTimerRef = useRef<NodeJS.Timeout | null>(null);

  const saveFile = useCallback(async (filePath: string, content: string) => {
    setSaveStatus("saving");
    try {
      const encodedPath = filePath.split("/").map(encodeURIComponent).join("/");
      await fetch(`/api/files/${projectId}/${encodedPath}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      setOpenFiles((prev) =>
        prev.map((f) => (f.path === filePath ? { ...f, isDirty: false } : f))
      );
      setSaveStatus("saved");
    } catch {
      setSaveStatus("unsaved");
    }
  }, [projectId]);

  function openFile(node: FileNode) {
    if (node.type !== "file") return;
    const already = openFiles.find((f) => f.path === node.path);
    if (already) { setActiveFile(node.path); return; }
    setOpenFiles((prev) => [
      ...prev,
      { name: node.name, path: node.path, content: node.content || "", isDirty: false },
    ]);
    setActiveFile(node.path);
  }

  function closeTab(filePath: string, e: React.MouseEvent) {
    e.stopPropagation();
    setOpenFiles((prev) => {
      const idx = prev.findIndex((f) => f.path === filePath);
      const next = prev.filter((f) => f.path !== filePath);
      if (activeFile === filePath)
        setActiveFile(next[idx]?.path ?? next[idx - 1]?.path ?? null);
      return next;
    });
  }

  function updateCode(value: string | undefined, currentActiveFile: string) {
    const content = value || "";
    setOpenFiles((prev) =>
      prev.map((f) => (f.path === currentActiveFile ? { ...f, content, isDirty: true } : f))
    );
    setSaveStatus("unsaved");
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => saveFile(currentActiveFile, content), 600);
  }

  return { openFiles, setOpenFiles, activeFile, setActiveFile, saveStatus, saveFile, openFile, closeTab, updateCode };
}

// ─── useYjs ───────────────────────────────────────────────────────────────────
// Manages collaborative YJS sessions per active file.

export function useYjs(projectId: string) {
  const providerRef = useRef<WebsocketProvider | null>(null);
  const bindingRef = useRef<MonacoBinding | null>(null);
  const ydocRef = useRef<Y.Doc | null>(null);

  function cleanup() {
    bindingRef.current?.destroy(); bindingRef.current = null;
    providerRef.current?.destroy(); providerRef.current = null;
    ydocRef.current?.destroy(); ydocRef.current = null;
  }

  function mount(
    editor: any,
    activeFile: string,
    currentContent: string,
    tokenRef: React.MutableRefObject<string | null>,
    currentUser: { name: string | null; email: string | null } | null,
    onUsersChange: (users: ActiveUser[]) => void
  ) {
    const roomName = `project-${projectId}-${activeFile}`;
    const ydoc = new Y.Doc();
    ydocRef.current = ydoc;

    const provider = new WebsocketProvider(`wss://oran.onrender.com/yjs`, roomName, ydoc, {
      params: { token: tokenRef.current || "" },
    });
    providerRef.current = provider;

    const yText = ydoc.getText("content");
    if (yText.length === 0 && currentContent) yText.insert(0, currentContent);

    bindingRef.current = new MonacoBinding(
      yText,
      editor.getModel()!,
      new Set([editor]),
      provider.awareness
    );

    const color = `#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, "0")}`;
    provider.awareness.setLocalStateField("user", {
      name: currentUser?.name || currentUser?.email || "Anonymous",
      email: currentUser?.email || null,
      color,
    });

    provider.awareness.on("change", () => {
      const states = Array.from(provider.awareness.getStates().entries());
      onUsersChange(
        states
          .filter(([, s]) => s?.user)
          .map(([id, s]) => ({
            userId: String(id),
            name: s.user.name || null,
            email: s.user.email || null,
            color: s.user.color || "#888",
          }))
      );
    });
  }

  return { cleanup, mount };
}