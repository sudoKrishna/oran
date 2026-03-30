"use client";

import { getSocket } from "@/lib/terminalSocket";
import dynamic from "next/dynamic";
import { useEffect, useRef, useState, useCallback } from "react";
import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";
import { MonacoBinding } from "y-monaco";
import PresenceHub from "./PresenceHub";

const Editor = dynamic(() => import("@monaco-editor/react"), { ssr: false });

type FileNode = {
  name: string;
  path: string;
  type: "file" | "folder";
  content?: string;
  children?: FileNode[];
};

type OpenFile = {
  name: string;
  path: string;
  content: string;
  isDirty: boolean;
};

type Props = {
  projectId: string;
};

function getLanguage(filename: string): string {
  if (filename.endsWith(".ts") || filename.endsWith(".tsx")) return "typescript";
  if (filename.endsWith(".jsx")) return "javascript";
  if (filename.endsWith(".js")) return "javascript";
  if (filename.endsWith(".json")) return "json";
  if (filename.endsWith(".css")) return "css";
  if (filename.endsWith(".html")) return "html";
  if (filename.endsWith(".md")) return "markdown";
  return "plaintext";
}

export default function VSCodeUI({ projectId }: Props) {
  const [fileTree, setFileTree] = useState<FileNode[]>([]);
  const [openFiles, setOpenFiles] = useState<OpenFile[]>([]);
  const [activeFile, setActiveFile] = useState<string | null>(null);

  const [isCreating, setIsCreating] = useState(false);
  const [newFileName, setNewFileName] = useState("");
  const [editingPath, setEditingPath] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "unsaved">("saved");

  const saveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const providerRef = useRef<WebsocketProvider | null>(null);
  const bindingRef = useRef<MonacoBinding | null>(null);
  const ydocRef = useRef<Y.Doc | null>(null);
  const isFirstRender = useRef(true);


  const [showAiPanel, setShowAiPanel] = useState(false);
  const [aiTab, setAiTab] = useState<"issues" | "suggest" | "chat">("issues");
  const [aiMessages, setAiMessages] = useState<{ role: string; content: string }[]>([]);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiResponse, setAiResponse] = useState("");
  const [aiWarning, setAiWarning] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);

  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [activeUsers, setActiveUsers] = useState<
    { userId: string; name: string | null; email: string | null; color: string }[]
  >([]);
  const [currentUser, setCurrentUser] = useState<{
    name: string | null;
    email: string | null;
  } | null>(null);
  const tokenRef = useRef<string | null>(null);


  useEffect(() => {
    if (!projectId) return;


    fetch(`/api/files/${projectId}`)
      .then((r) => r.json())
      .then(({ files }) => {
        const safeFiles = Array.isArray(files) ? files : [];
        setFileTree(safeFiles);
        const first = findFirstFile(safeFiles);
        if (first) openFile(first);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [projectId]);


  useEffect(() => {
    return () => cleanupYjs();
  }, []);


  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    cleanupYjs();
  }, [activeFile, projectId]);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((u) => {
        setCurrentUser({ name: u.name, email: u.email })
        setCurrentUserId(u.id);
      })
      .catch(console.error);

    fetch("/api/auth/token")
      .then((r) => r.json())
      .then(({ token }) => { tokenRef.current = token; })
      .catch(console.error)
  }, []);


  // AI
  const getCurrentCode = () => {
    if (!activeFile) return "";
    const file = openFiles.find(f => f.path === activeFile);
    return file?.content || "";
  };

  const askAI = async (userPrompt: string) => {
    if (!activeFile) {
      alert("Open a file first before using AI");
      return;
    }

    setIsAiLoading(true);
    setAiWarning(null);
    setShowAiPanel(true);

    const currentCode = openFiles.find((f) => f.path === activeFile)?.content || "";
    const fullPrompt = `${userPrompt}\n\nCurrent file (${activeFile}):\n\`\`\`\n${currentCode}\n\`\`\``;

    const updatedMessages = [
      ...aiMessages,
      { role: "user", content: fullPrompt },
    ];

    try {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: updatedMessages }),
      });

      const data = await response.json();
      const assistantMessage = { role: "assistant", content: data.content || "No response." };

      setAiMessages([...updatedMessages, assistantMessage]);
      setAiResponse(data.content || "No response.");
      if (data.warning) setAiWarning(data.warning);
      setAiTab("chat");
    } catch (err) {
      console.error("AI call failed:", err);
      setAiResponse("Failed to get AI response.");
    } finally {
      setIsAiLoading(false);
      setAiPrompt("");
    }
  };
  function cleanupYjs() {
    bindingRef.current?.destroy();
    bindingRef.current = null;
    providerRef.current?.destroy();
    providerRef.current = null;
    ydocRef.current?.destroy();
    ydocRef.current = null;
  }

  function handleEditorDidMount(editor: any, _monaco: any) {
    if (!activeFile) return;

    const roomName = `project-${projectId}-${activeFile}`;
    const ydoc = new Y.Doc();
    ydocRef.current = ydoc;


    const wsUrl = `ws://localhost:1234`;
    const provider = new WebsocketProvider(wsUrl, roomName, ydoc, {
      params: {
        projectId,
        token: tokenRef.current || "",
      },
    });
    providerRef.current = provider;

    const yText = ydoc.getText("content");
    if (yText.length === 0) {
      const currentContent = openFiles.find((f) => f.path === activeFile)?.content || "";
      if (currentContent) yText.insert(0, currentContent);
    }

    const binding = new MonacoBinding(
      yText,
      editor.getModel()!,
      new Set([editor]),
      provider.awareness
    );
    bindingRef.current = binding;


    const color = `#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, "0")}`;
    provider.awareness.setLocalStateField("user", {
      name: currentUser?.name || currentUser?.email || "Anonymous",
      email: currentUser?.email || null,
      color,
    });


    provider.awareness.on("change", () => {
      const states = Array.from(provider.awareness.getStates().entries());
      const users = states
        .filter(([, state]) => state?.user)
        .map(([clientId, state]) => ({
          userId: String(clientId),
          name: state.user.name || null,
          email: state.user.email || null,
          color: state.user.color || "#888",
        }));
      setActiveUsers(users);
    });
  }

  function findFirstFile(nodes: FileNode[] | null | undefined): FileNode | null {
    if (!nodes?.length) return null;
    for (const node of nodes) {
      if (node.type === "file") return node;
      if (node.children) {
        const found = findFirstFile(node.children);
        if (found) return found;
      }
    }
    return null;
  }

  function openFile(node: FileNode) {
    if (node.type !== "file") return;
    const already = openFiles.find((f) => f.path === node.path);
    if (already) {
      setActiveFile(node.path);
      return;
    }
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
      if (activeFile === filePath) {
        setActiveFile(next[idx]?.path ?? next[idx - 1]?.path ?? null);
      }
      return next;
    });
    if (filePath === activeFile) cleanupYjs();
  }

  // save file → Neon via Next.js API
  const saveFile = useCallback(
    async (filePath: string, content: string) => {
      setSaveStatus("saving");
      try {
        // :filePath — Nextjs route → Prisma → Neon
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
      } catch (err) {
        console.error("Save failed:", err);
        setSaveStatus("unsaved");
      }
    },
    [projectId]
  );

  function updateCode(value: string | undefined) {
    if (!activeFile) return;
    const content = value || "";
    setOpenFiles((prev) =>
      prev.map((f) => (f.path === activeFile ? { ...f, content, isDirty: true } : f))
    );
    setSaveStatus("unsaved");
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => saveFile(activeFile, content), 600);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if ((e.ctrlKey || e.metaKey) && e.key === "s") {
      e.preventDefault();
      if (activeFile) {
        const file = openFiles.find((f) => f.path === activeFile);
        if (file) {
          if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
          saveFile(activeFile, file.content);
        }
      }
    }
    if (e.key === "Delete" && activeFile) {
      const idx = openFiles.findIndex((f) => f.path === activeFile);
      if (idx !== -1) deleteFile(openFiles[idx]);
    }
    if (e.key === "F2" && activeFile) {
      setEditingPath(activeFile);
      const file = openFiles.find((f) => f.path === activeFile);
      if (file) setEditName(file.name);
    }
  }


  const handleCreateFile = async () => {
    if (!newFileName.trim()) return;
    let name = newFileName.trim();
    if (!name.includes(".")) name += ".js";

    try {
      // :projectId/:name — Nextjs route → Prisma upsert → Neon
      const encodedName = encodeURIComponent(name);
      await fetch(`/api/files/${projectId}/${encodedName}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: "" }),
      });

      const newNode: FileNode = { name, path: name, type: "file", content: "" };
      setFileTree((prev) => [...prev, newNode]);
      openFile(newNode);
    } catch (err) {
      console.error("Create file failed:", err);
    }

    setNewFileName("");
    setIsCreating(false);
  };

  function removeNode(nodes: FileNode[], path: string): FileNode[] {
    return nodes
      .filter((n) => n.path !== path)
      .map((n) => (n.children ? { ...n, children: removeNode(n.children, path) } : n));
  }

  //  delete file → neon via Nextjs API
  function deleteFile(file: OpenFile) {
    closeTab(file.path, { stopPropagation: () => { } } as React.MouseEvent);
    setFileTree((prev) => removeNode(prev, file.path));

    // :projectId/:filePath — Next route → Prisma delete → Neon
    const encodedPath = file.path.split("/").map(encodeURIComponent).join("/");
    fetch(`/api/files/${projectId}/${encodedPath}`, { method: "DELETE" }).catch(
      console.error
    );
  }

  const saveRename = () => {
    if (!editingPath || !editName.trim()) return;
    const dir = editingPath.includes("/")
      ? editingPath.substring(0, editingPath.lastIndexOf("/") + 1)
      : "";
    const newPath = dir + editName.trim();

    function updateNode(nodes: FileNode[]): FileNode[] {
      return nodes.map((n) => {
        if (n.path === editingPath) return { ...n, name: editName.trim(), path: newPath };
        if (n.children) return { ...n, children: updateNode(n.children) };
        return n;
      });
    }

    setFileTree((prev) => updateNode(prev));
    setOpenFiles((prev) =>
      prev.map((f) =>
        f.path === editingPath ? { ...f, name: editName.trim(), path: newPath } : f
      )
    );
    if (activeFile === editingPath) setActiveFile(newPath);
    setEditingPath(null);
    setEditName("");
  };

  //  Run filehits backend 
  const runFile = async () => {
    if (!activeFile) return;
    const file = openFiles.find((f) => f.path === activeFile);
    if (!file) return;

    const socket = getSocket();
    if (!socket || socket.readyState !== WebSocket.OPEN) {
      alert("Terminal not connected. Open the floating terminal first.");
      return;
    }


    await saveFile(activeFile, file.content);

    const HTTP_URL = process.env.NEXT_PUBLIC_HTTP_URL ?? "http://localhost:8081";

    const res = await fetch(`${HTTP_URL}/run`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },

      body: JSON.stringify({ code: file.content, name: file.name, projectId }),
    });

    if (!res.ok) {
      const { error } = await res.json().catch(() => ({ error: "Unknown error" }));
      alert(`Run failed: ${error}`);
      return;
    }

    const { path: containerPath } = await res.json();


    const ext = file.name.split(".").pop()?.toLowerCase();
    const runCmd: Record<string, string> = {
      js: `node "${containerPath}"`,
      ts: `npx ts-node "${containerPath}"`,
      py: `python3 "${containerPath}"`,
      rb: `ruby "${containerPath}"`,
      go: `go run "${containerPath}"`,
      sh: `sh "${containerPath}"`,
    };

    const cmd = runCmd[ext ?? ""] ?? `node "${containerPath}"`;
    socket.send(`${cmd}\r`);
  };
  const activeFileObj = openFiles.find((f) => f.path === activeFile) ?? null;

  function renderTree(nodes: FileNode[] | null | undefined, depth = 0): React.ReactNode {
    if (!nodes?.length) return null;
    return nodes.map((node) => (
      <div key={`tree-${node.path || node.name}-${depth}`}>
        <div
          className={`flex items-center justify-between px-3 py-1.5 text-sm cursor-pointer group ${activeFile === node.path ? "bg-[#37373d]" : "hover:bg-[#2a2d2e]"
            }`}
          style={{ paddingLeft: `${12 + depth * 12}px` }}
          onClick={() => node.type === "file" && openFile(node)}
        >
          {editingPath === node.path ? (
            <input
              autoFocus
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") saveRename();
                if (e.key === "Escape") setEditingPath(null);
              }}
              className="bg-[#2a2d2e] px-1 rounded w-full mr-2 outline-none"
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <span className="flex items-center gap-1.5 flex-1 truncate">
              <span className="text-xs opacity-50">{node.type === "folder" ? "▶" : ""}</span>
              {node.name}
            </span>
          )}
        </div>
        {node.type === "folder" && node.children && (
          <div>{renderTree(node.children, depth + 1)}</div>
        )}
      </div>
    ));
  }

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      className="h-screen flex bg-[#1e1e1e] text-white outline-none"
      onKeyDown={handleKeyDown}
    >
      {/* Activity bar */}
      <div className="w-14 m-2 flex flex-col items-center py-4 gap-6 
  rounded-xl 
  bg-white/5 
  backdrop-blur-2xl 
  border border-white/10 
  shadow-[inset_0_0_10px_rgba(255,255,255,0.05)]"
      >
        {["📁", "🔍", "⚙️"].map((icon, i) => (
          <button
            key={i}
            className="text-lg text-white/40 hover:text-white 
      transition-all duration-200 
      hover:scale-110 
      hover:bg-white/10 
      p-2 rounded-lg"
          >
            {icon}
          </button>
        ))}
      </div>


      {/* Sidebar */}
      <div className="w-64 flex flex-col bg-white/5 backdrop-blur-2xl border border-white/10 shadow-[inset_0_0_10px_rgba(255,255,255,0.05)] rounded-xl">

        {/* Header */}
        <div className="px-4 py-3 text-xs font-medium text-white/50 uppercase tracking-wider flex justify-between items-center">
          Explorer
          <button
            onClick={() => setIsCreating(true)}
            className="text-white/40 hover:text-white text-lg transition-all duration-200"
            title="New file"
          >
            +
          </button>
        </div>

        {/* New file input */}
        {isCreating && (
          <div className="px-4 pb-2">
            <input
              autoFocus
              value={newFileName}
              onChange={(e) => setNewFileName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleCreateFile();
                if (e.key === "Escape") {
                  setIsCreating(false);
                  setNewFileName("");
                }
              }}
              placeholder="filename.js"
              className="w-full px-3 py-1.5 text-sm bg-white/5 border border-white/10 focus:border-white/20 rounded-md outline-none text-white/70 placeholder:text-white/40 transition"
            />
          </div>
        )}

        {/* File tree */}
        <div className="flex-1 overflow-y-auto px-2 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
          {loading ? (
            <div className="px-3 py-4 text-xs text-white/50">Loading files...</div>
          ) : (
            renderTree(fileTree)
          )}
        </div>
      </div>
      {/* AI Panel */}
      <div>
        {showAiPanel && (
          <div className="w-72 bg-white/5 backdrop-blur-xl border-l border-white/10 flex flex-col text-sm rounded-l-xl shadow-lg">

            {/* Header */}
            <div className="flex items-center justify-between px-3 py-2 border-b border-white/10">
              <span className="text-purple-400 text-xs font-medium flex items-center gap-1.5">✦ AI Assistant</span>
              <button onClick={() => setShowAiPanel(false)} className="text-white/50 hover:text-white text-xs">✕</button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-white/10">
              {(["issues", "suggest", "chat"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setAiTab(tab)}
                  className={`flex-1 py-1.5 text-xs capitalize transition-colors ${aiTab === tab
                    ? "text-purple-400 border-b border-purple-500"
                    : "text-white/50 hover:text-white"
                    }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-3">
              {aiTab === "chat" && (
                <>
                  {aiMessages.length === 0 && !isAiLoading && (
                    <p className="text-xs text-white/50 text-center mt-8">
                      Use a quick action or ask anything about this file.
                    </p>
                  )}
                  {isAiLoading && (
                    <div className="text-xs text-purple-400 animate-pulse">AI is thinking...</div>
                  )}
                  {aiWarning && (
                    <div className="text-xs text-yellow-400 bg-yellow-950 rounded px-2 py-1.5">{aiWarning}</div>
                  )}
                  {aiMessages.map((msg, i) => (
                    <div
                      key={i}
                      className={`text-xs rounded px-2 py-1.5 ${msg.role === "user"
                        ? "bg-white/10 text-white/70 self-end max-w-[90%]"
                        : "bg-white/5 text-white/80"
                        }`}
                    >
                      <pre className="whitespace-pre-wrap font-mono text-[10px] leading-relaxed">{msg.content}</pre>
                    </div>
                  ))}
                </>
              )}

              {aiTab === "issues" && (
                <div className="flex flex-col gap-2">
                  <p className="text-xs text-white/50">
                    Click <span className="text-purple-400">Debug</span> to review issues in the current file.
                  </p>
                  {aiResponse && (
                    <div className="bg-white/10 rounded p-2 text-xs text-white/70">
                      <pre className="whitespace-pre-wrap font-mono text-[10px] leading-relaxed">{aiResponse}</pre>
                    </div>
                  )}
                </div>
              )}

              {aiTab === "suggest" && (
                <div className="flex flex-col gap-2">
                  <p className="text-xs text-white/50">
                    Click <span className="text-purple-400">Improve</span> to get refactoring suggestions.
                  </p>
                  {aiResponse && (
                    <div className="bg-white/5 border border-purple-700 rounded p-2 text-xs text-purple-200">
                      <pre className="whitespace-pre-wrap font-mono text-[10px] leading-relaxed">{aiResponse}</pre>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Quick actions + prompt */}
            <div className="border-t border-white/10 p-2 flex flex-col gap-2">
              <div className="flex flex-wrap gap-1">
                {[
                  { label: "Explain", prompt: "Explain this code clearly" },
                  { label: "Debug", prompt: "Find bugs and suggest fixes" },
                  { label: "Improve", prompt: "Suggest improvements or refactoring" },
                  { label: "Add types", prompt: "Add proper TypeScript types where missing" },
                ].map(({ label, prompt }) => (
                  <button
                    key={label}
                    onClick={() => { setAiTab("chat"); askAI(prompt); }}
                    disabled={isAiLoading}
                    className="text-[10px] px-2 py-1 bg-white/10 text-white/50 hover:text-purple-400 hover:border-purple-700 border border-white/10 rounded disabled:opacity-40"
                  >
                    {label}
                  </button>
                ))}
              </div>
              <div className="flex gap-1">
                <textarea
                  rows={2}
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      if (aiPrompt.trim()) { setAiTab("chat"); askAI(aiPrompt.trim()); }
                    }
                  }}
                  placeholder="Ask about this file..."
                  className="flex-1 bg-white/5 border border-white/10 focus:border-purple-700 rounded px-2 py-1 text-xs text-white/70 font-mono resize-none outline-none"
                />
                <button
                  onClick={() => { if (aiPrompt.trim()) { setAiTab("chat"); askAI(aiPrompt.trim()); } }}
                  disabled={isAiLoading || !aiPrompt.trim()}
                  className="px-2 bg-purple-900 hover:bg-purple-800 text-purple-300 rounded disabled:opacity-40"
                >
                  ↑
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      {/* Presence bar — who's in this project */}
      {activeUsers.length > 0 && (
        <div className="flex items-center gap-2 px-3 py-1 bg-black/30 border-b border-white/10">
          <span className="text-xs text-white/30">In this file:</span>
          <div className="flex items-center gap-1.5">
            {activeUsers.map((u) => (
              <div
                key={u.userId}
                className="relative group"
              >
                {/* Avatar circle */}
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white uppercase cursor-default"
                  style={{ backgroundColor: u.color }}
                >
                  {(u.name || u.email || "?")[0]}
                </div>

                {/* Tooltip on hover */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:flex flex-col items-center z-50">
                  <div className="bg-[#1e1e1e] border border-white/10 rounded px-2 py-1 text-xs whitespace-nowrap shadow-lg">
                    <p className="text-white/90 font-medium">{u.name || "Anonymous"}</p>
                    {u.email && <p className="text-white/40">{u.email}</p>}
                  </div>
                  <div className="w-1.5 h-1.5 bg-[#1e1e1e] border-r border-b border-white/10 rotate-45 -mt-px" />
                </div>
              </div>
            ))}
          </div>

          {activeUsers.length === 1 && (
            <span className="text-xs text-white/20 ml-1">Only you</span>
          )}
        </div>
      )}


      {/* Editor area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Tab bar */}
        <div className="flex bg-black backdrop-blur-xl border-b border-white/10 overflow-x-auto min-h-[36px]">

          {/* Open files tabs */}
          <div className="flex flex-1">
            {openFiles.map((file) => (
              <div
                key={file.path}
                onClick={() => setActiveFile(file.path)}
                className={`flex items-center gap-2 px-3 py-2 text-sm cursor-pointer border-r border-white/10 whitespace-nowrap group transition-colors ${activeFile === file.path
                  ? "bg-[#1E1E1E] text-white border-t-2 border-blue-500"
                  : "bg-transparent text-white/50 hover:text-white/80"
                  }`}
              >
                <span>{file.name}</span>
                {file.isDirty && <span className="w-1.5 h-1.5 rounded-full bg-white opacity-70" />}
                <span
                  onClick={(e) => closeTab(file.path, e)}
                  className="opacity-0 group-hover:opacity-60 hover:!opacity-100 text-xs leading-none"
                >
                  ✕
                </span>
              </div>
            ))}
          </div>

          {/* Right-side actions */}
          <div className="flex items-center gap-2 px-3 ml-auto">
            <span className="text-xs text-white/50">
              {saveStatus === "saving"
                ? "Saving..."
                : saveStatus === "unsaved"
                  ? "Unsaved"
                  : ""}
            </span>
            {activeFile && (
              <button
                onClick={runFile}
                className="px-3 py-1 text-xs bg-green-700 hover:bg-green-600 rounded flex items-center gap-1 text-white transition"
              >
                ▶ Run
              </button>
            )}
            {activeFile && (
              <button
                onClick={() => setShowAiPanel((p) => !p)}
                className={`px-3 py-1 text-xs rounded flex items-center gap-1.5 transition-colors ${showAiPanel
                  ? "bg-purple-800 text-purple-200"
                  : "bg-white/5 text-purple-400 hover:bg-purple-900"
                  }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full bg-purple-400 ${isAiLoading ? "animate-pulse" : ""}`} />
                AI
              </button>
            )}
          </div>


        </div>

        {/* Monaco editor */}
        <div className="flex-1 overflow-hidden">
          {activeFileObj ? (
            <Editor
              height="100%"
              language={getLanguage(activeFileObj.name)}
              theme="vs-dark"
              value={activeFileObj.content}
              onChange={updateCode}
              onMount={handleEditorDidMount}
              options={{
                fontSize: 14,
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                wordWrap: "on",
              }}
            />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500 text-sm">
              {loading ? "Loading project..." : "Select a file to start editing"}
            </div>
          )}

        </div>

        {/* Status bar */}
        <div className="flex items-center justify-between px-4 py-0.5 bg-[#007acc] text-white text-xs">
          <span>Project: {projectId.slice(0, 8)}...</span>
          <span>{activeFileObj ? getLanguage(activeFileObj.name) : ""}</span>
        </div>
      </div>
      <PresenceHub
        activeUsers={activeUsers}
        currentUserId={currentUserId ?? undefined}
      />
    </div>
  );
}