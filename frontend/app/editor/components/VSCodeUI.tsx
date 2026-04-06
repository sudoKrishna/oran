"use client";

import { getSocket } from "@/lib/terminalSocket";
import dynamic from "next/dynamic";
import { useEffect, useRef, useState, useCallback } from "react";
import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";
import { MonacoBinding } from "y-monaco";
import PresenceHub from "@/app/components/PresenceHub";

import { FileNode, OpenFile, AiTab, AiMessage, ActiveUser } from "../types";
import { getLanguage } from "../lib/utils";
import {
  animateGhostText,
  triggerContextRipple,
  openAiPanel,
  closeAiPanel,
  pulseOrb,
  stopOrb,
} from "../lib/animations";

import ActivityBar from "./ActivityBar";
import Sidebar from "./Sidebar";
import TabBar from "./TabBar";
import StatusBar from "./StatusBar";
import AiPanel from "./AiPanel";

const Editor = dynamic(() => import("@monaco-editor/react"), { ssr: false });

type Props = { projectId: string };


function findFirstFile(nodes: FileNode[] | null | undefined): FileNode | null {
  if (!nodes?.length) return null;
  for (const node of nodes) {
    if (node.type === "file") return node;
    if (node.children) { const found = findFirstFile(node.children); if (found) return found; }
  }
  return null;
}

function removeNode(nodes: FileNode[], path: string): FileNode[] {
  return nodes
    .filter((n) => n.path !== path)
    .map((n) => (n.children ? { ...n, children: removeNode(n.children, path) } : n));
}


export default function VSCodeUI({ projectId }: Props) {
 
  const [fileTree, setFileTree] = useState<FileNode[]>([]);
  const [openFiles, setOpenFiles] = useState<OpenFile[]>([]);
  const [activeFile, setActiveFile] = useState<string | null>(null);
  const [editingPath, setEditingPath] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "unsaved">("saved");
  const saveTimerRef = useRef<NodeJS.Timeout | null>(null);


  const providerRef = useRef<WebsocketProvider | null>(null);
  const bindingRef = useRef<MonacoBinding | null>(null);
  const ydocRef = useRef<Y.Doc | null>(null);
  const isFirstRender = useRef(true);


  const [showAiPanel, setShowAiPanel] = useState(false);
  const [aiPanelMounted, setAiPanelMounted] = useState(false);
  const [aiTab, setAiTab] = useState<AiTab>("issues");
  const [aiMessages, setAiMessages] = useState<AiMessage[]>([]);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiResponse, setAiResponse] = useState("");
  const [aiWarning, setAiWarning] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);

  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [activeUsers, setActiveUsers] = useState<ActiveUser[]>([]);
  const [currentUser, setCurrentUser] = useState<{ name: string | null; email: string | null } | null>(null);
  const tokenRef = useRef<string | null>(null);


  const aiPanelRef = useRef<HTMLDivElement>(null);
  const orbRef = useRef<HTMLSpanElement>(null);
  const editorAreaRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);


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

  useEffect(() => { return () => cleanupYjs(); }, []);
  useEffect(() => {
    if (isFirstRender.current) { isFirstRender.current = false; return; }
    cleanupYjs();
  }, [activeFile, projectId]);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((u) => { setCurrentUser({ name: u.name, email: u.email }); setCurrentUserId(u.id); })
      .catch(console.error);
    fetch("/api/auth/token")
      .then((r) => r.json())
      .then(({ token }) => { tokenRef.current = token; })
      .catch(console.error);
  }, []);


  useEffect(() => {
    if (!orbRef.current) return;
    if (isAiLoading) {
      pulseOrb(orbRef.current, "rgba(167,139,250,0.7)");
      if (editorAreaRef.current) triggerContextRipple(editorAreaRef.current);
    } else {
      stopOrb(orbRef.current);
    }
  }, [isAiLoading]);

 
  useEffect(() => {
    if (aiMessages.length > 0) {
      setTimeout(() => animateGhostText(".ai-msg-new"), 50);
    }
  }, [aiMessages]);


  const handleToggleAiPanel = () => {
    if (showAiPanel) {
      if (aiPanelRef.current) {
        closeAiPanel(aiPanelRef.current, () => {
          setShowAiPanel(false);
          setAiPanelMounted(false);
        });
      }
    } else {
      setAiPanelMounted(true);
      setShowAiPanel(true);
      requestAnimationFrame(() => {
        if (aiPanelRef.current) openAiPanel(aiPanelRef.current);
      });
    }
  };

  const askAI = async (userPrompt: string) => {
    if (!activeFile) { alert("Open a file first before using AI"); return; }
    setIsAiLoading(true);
    setAiWarning(null);
    if (!showAiPanel) handleToggleAiPanel();

    const currentCode = openFiles.find((f) => f.path === activeFile)?.content || "";
    const fullPrompt = `${userPrompt}\n\nCurrent file (${activeFile}):\n\`\`\`\n${currentCode}\n\`\`\``;
    const updatedMessages = [...aiMessages, { role: "user", content: fullPrompt }];

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
    bindingRef.current?.destroy(); bindingRef.current = null;
    providerRef.current?.destroy(); providerRef.current = null;
    ydocRef.current?.destroy(); ydocRef.current = null;
  }

  function handleEditorDidMount(editor: any, _monaco: any) {
    if (!activeFile) return;
    const roomName = `project-${projectId}-${activeFile}`;
    const ydoc = new Y.Doc();
    ydocRef.current = ydoc;
    const provider = new WebsocketProvider(`wss://oran.onrender.com/yjs`, roomName, ydoc, {
      params: { projectId, token: tokenRef.current || "" },
    });
    providerRef.current = provider;
    const yText = ydoc.getText("content");
    if (yText.length === 0) {
      const currentContent = openFiles.find((f) => f.path === activeFile)?.content || "";
      if (currentContent) yText.insert(0, currentContent);
    }
    bindingRef.current = new MonacoBinding(yText, editor.getModel()!, new Set([editor]), provider.awareness);
    const color = `#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, "0")}`;
    provider.awareness.setLocalStateField("user", {
      name: currentUser?.name || currentUser?.email || "Anonymous",
      email: currentUser?.email || null,
      color,
    });
    provider.awareness.on("change", () => {
      const states = Array.from(provider.awareness.getStates().entries());
      setActiveUsers(
        states.filter(([, s]) => s?.user).map(([id, s]) => ({
          userId: String(id), name: s.user.name || null,
          email: s.user.email || null, color: s.user.color || "#888",
        }))
      );
    });
  }

  function openFile(node: FileNode) {
    if (node.type !== "file") return;
    const already = openFiles.find((f) => f.path === node.path);
    if (already) { setActiveFile(node.path); return; }
    setOpenFiles((prev) => [...prev, { name: node.name, path: node.path, content: node.content || "", isDirty: false }]);
    setActiveFile(node.path);
  }

  function closeTab(filePath: string, e: React.MouseEvent) {
    e.stopPropagation();
    setOpenFiles((prev) => {
      const idx = prev.findIndex((f) => f.path === filePath);
      const next = prev.filter((f) => f.path !== filePath);
      if (activeFile === filePath) setActiveFile(next[idx]?.path ?? next[idx - 1]?.path ?? null);
      return next;
    });
    if (filePath === activeFile) cleanupYjs();
  }

  const saveFile = useCallback(async (filePath: string, content: string) => {
    setSaveStatus("saving");
    try {
      const encodedPath = filePath.split("/").map(encodeURIComponent).join("/");
      await fetch(`/api/files/${projectId}/${encodedPath}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      setOpenFiles((prev) => prev.map((f) => (f.path === filePath ? { ...f, isDirty: false } : f)));
      setSaveStatus("saved");
    } catch { setSaveStatus("unsaved"); }
  }, [projectId]);

  function updateCode(value: string | undefined) {
    if (!activeFile) return;
    const content = value || "";
    setOpenFiles((prev) => prev.map((f) => (f.path === activeFile ? { ...f, content, isDirty: true } : f)));
    setSaveStatus("unsaved");
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => saveFile(activeFile, content), 600);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if ((e.ctrlKey || e.metaKey) && e.key === "s") {
      e.preventDefault();
      if (activeFile) {
        const file = openFiles.find((f) => f.path === activeFile);
        if (file) { if (saveTimerRef.current) clearTimeout(saveTimerRef.current); saveFile(activeFile, file.content); }
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

  const handleCreateFile = async (name: string) => {
    try {
      await fetch(`/api/files/${projectId}/${encodeURIComponent(name)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: "" }),
      });
      const newNode: FileNode = { name, path: name, type: "file", content: "" };
      setFileTree((prev) => [...prev, newNode]);
      openFile(newNode);
    } catch (err) { console.error("Create file failed:", err); }
  };

  function deleteFile(file: OpenFile) {
    closeTab(file.path, { stopPropagation: () => {} } as React.MouseEvent);
    setFileTree((prev) => removeNode(prev, file.path));
    const encodedPath = file.path.split("/").map(encodeURIComponent).join("/");
    fetch(`/api/files/${projectId}/${encodedPath}`, { method: "DELETE" }).catch(console.error);
  }

  const saveRename = () => {
    if (!editingPath || !editName.trim()) return;
    const dir = editingPath.includes("/") ? editingPath.substring(0, editingPath.lastIndexOf("/") + 1) : "";
    const newPath = dir + editName.trim();
    const updateNode = (nodes: FileNode[]): FileNode[] =>
      nodes.map((n) => {
        if (n.path === editingPath) return { ...n, name: editName.trim(), path: newPath };
        if (n.children) return { ...n, children: updateNode(n.children) };
        return n;
      });
    setFileTree((prev) => updateNode(prev));
    setOpenFiles((prev) => prev.map((f) => (f.path === editingPath ? { ...f, name: editName.trim(), path: newPath } : f)));
    if (activeFile === editingPath) setActiveFile(newPath);
    setEditingPath(null); setEditName("");
  };

  const runFile = async () => {
    if (!activeFile) return;
    const file = openFiles.find((f) => f.path === activeFile);
    if (!file) return;
    const socket = getSocket();
    if (!socket || socket.readyState !== WebSocket.OPEN) { alert("Terminal not connected."); return; }
    await saveFile(activeFile, file.content);
    const HTTP_URL = process.env.NEXT_PUBLIC_HTTP_URL ?? "http://localhost:8081";
    const res = await fetch(`${HTTP_URL}/run`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: file.content, name: file.name, projectId }),
    });
    if (!res.ok) { const { error } = await res.json().catch(() => ({ error: "Unknown error" })); alert(`Run failed: ${error}`); return; }
    const { path: containerPath } = await res.json();
    const ext = file.name.split(".").pop()?.toLowerCase();
    const runCmd: Record<string, string> = {
      js: `node "${containerPath}"`, ts: `npx ts-node "${containerPath}"`,
      py: `python3 "${containerPath}"`, rb: `ruby "${containerPath}"`,
      go: `go run "${containerPath}"`, sh: `sh "${containerPath}"`,
    };
    socket.send(`${runCmd[ext ?? ""] ?? `node "${containerPath}"`}\r`);
  };

  const activeFileObj = openFiles.find((f) => f.path === activeFile) ?? null;

  
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;500&family=Outfit:wght@300;400;500;600&display=swap');
        @keyframes bounce {
          0%, 100% { transform: translateY(0); opacity: 0.4; }
          50% { transform: translateY(-4px); opacity: 1; }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        * { font-family: 'Outfit', sans-serif; box-sizing: border-box; }
        .editor-monaco * { font-family: 'JetBrains Mono', monospace !important; }
      `}</style>

      <div
        ref={containerRef}
        tabIndex={0}
        className="h-screen flex outline-none relative overflow-hidden bg-[#0a0a12]"
        onKeyDown={handleKeyDown}
      >
        {/* Noise texture */}
        <div
          className="fixed inset-0 z-0 pointer-events-none opacity-[0.025]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          }}
        />

  
        <div className="fixed -top-[200px] -right-[200px] w-[600px] h-[600px] rounded-full pointer-events-none z-0"
          style={{ background: "radial-gradient(circle, rgba(139,92,246,0.06) 0%, transparent 70%)" }} />

        <ActivityBar userInitial={currentUser?.name?.[0] ?? currentUser?.email?.[0] ?? "?"} />

        {/* Sidebar */}
        <Sidebar
          fileTree={fileTree}
          activeFile={activeFile}
          loading={loading}
          projectId={projectId}
          onOpenFile={openFile}
          onCreateFile={handleCreateFile}
        />

        {/* Editor Area */}
        <div
          ref={editorAreaRef}
          className="flex-1 flex flex-col min-w-0 relative z-10"
          style={{ boxShadow: "inset 0 0 80px rgba(139,92,246,0.03)", transition: "box-shadow 0.6s" }}
        >
          {/* Tab bar */}
          <TabBar
            openFiles={openFiles}
            activeFile={activeFile}
            saveStatus={saveStatus}
            isAiLoading={isAiLoading}
            showAiPanel={showAiPanel}
            orbRef={orbRef}
            onTabClick={setActiveFile}
            onCloseTab={closeTab}
            onRun={runFile}
            onToggleAi={handleToggleAiPanel}
          />

          {/* Monaco wrapper */}
          <div className="flex-1 mx-2 mt-[6px] rounded-tl-[12px] rounded-tr-[12px] overflow-hidden border border-white/[0.06] border-b-0 bg-[#0d0d1a]">
            {activeFileObj ? (
              <div className="h-full editor-monaco">
                <Editor
                  height="100%"
                  language={getLanguage(activeFileObj.name)}
                  theme="vs-dark"
                  value={activeFileObj.content}
                  onChange={updateCode}
                  onMount={handleEditorDidMount}
                  options={{
                    fontSize: 13.5,
                    fontFamily: "'JetBrains Mono', monospace",
                    fontLigatures: true,
                    minimap: { enabled: false },
                    scrollBeyondLastLine: false,
                    wordWrap: "on",
                    padding: { top: 16, bottom: 16 },
                    lineHeight: 1.8,
                    cursorBlinking: "smooth",
                    renderLineHighlight: "gutter",
                    smoothScrolling: true,
                  }}
                />
              </div>
            ) : (
              <div className="flex items-center justify-center h-full flex-col gap-3">
                <div className="w-12 h-12 rounded-full bg-violet-500/[0.12] flex items-center justify-center text-xl">
                  ⬡
                </div>
                <span className="text-gray-500 text-[13px]">
                  {loading ? "Loading project…" : "Select a file to start editing"}
                </span>
              </div>
            )}
          </div>

          {/* Status bar */}
          <StatusBar
            projectId={projectId}
            activeUsers={activeUsers}
            language={activeFileObj ? getLanguage(activeFileObj.name) : ""}
          />
        </div>

        {/* AI Panel */}
        {aiPanelMounted && (
          <AiPanel
            panelRef={aiPanelRef}
            isAiLoading={isAiLoading}
            aiTab={aiTab}
            setAiTab={setAiTab}
            aiMessages={aiMessages}
            aiResponse={aiResponse}
            aiWarning={aiWarning}
            aiPrompt={aiPrompt}
            setAiPrompt={setAiPrompt}
            onClose={handleToggleAiPanel}
            onAsk={askAI}
          />
        )}

        {/* Presence */}
        <PresenceHub activeUsers={activeUsers} currentUserId={currentUserId ?? undefined} />
        
      </div>
    </>
  );
}