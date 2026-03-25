"use client";

import { getSocket } from "@/lib/terminalSocket";
import dynamic from "next/dynamic";
import { useEffect, useRef, useState, useCallback } from "react";
import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";
import { MonacoBinding } from "y-monaco";

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

  //load files from server on mount 
  useEffect(() => {
    if (!projectId) return;

    fetch(`http://localhost:8081/files/${projectId}`)
      .then((r) => r.json())
      .then(({ files }) => {
        setFileTree(files);
       
        const first = findFirstFile(files);
        if (first) openFile(first);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [projectId]);

  useEffect(() => {
   return () => {
    cleanupYjs();
   }
  }, []);

  useEffect(() => {
    cleanupYjs();
  } , [activeFile , projectId])

  function cleanupYjs() {
    if (bindingRef.current) {
      bindingRef.current.destroy();
      bindingRef.current = null;
    }
    if (providerRef.current) {
      providerRef.current.destroy();
      providerRef.current = null;
    }
    if (ydocRef.current) {
      ydocRef.current.destroy();
      ydocRef.current = null;
    }
  }


 function handleEditorDidMount(editor: any, monaco: any) {
    if (!activeFile) return;

    const roomName = `project-${projectId}-${activeFile ||  "default"}`;

    const ydoc = new Y.Doc();
    ydocRef.current = ydoc;

    const provider = new WebsocketProvider("ws://localhost:1234", roomName, ydoc);
    providerRef.current = provider;

    const yText = ydoc.getText("content");

    // Set initial content only if Yjs document is empty
    if (yText.length === 0) {
      const currentContent = openFiles.find(f => f.path === activeFile)?.content || "";
      if (currentContent) yText.insert(0, currentContent);
    }

    const binding = new MonacoBinding(
      yText,
      editor.getModel()!,          
      new Set([editor]),
      provider.awareness
    );

    bindingRef.current = binding;

    
    provider.awareness.setLocalStateField("user", {
      name: `User-${Math.floor(Math.random() * 9000) + 1000}`,
      color: `#${Math.floor(Math.random() * 16777215).toString(16)}`,
    });
  }

  // find first file in tree
  function findFirstFile(nodes: FileNode[]): FileNode | null {
    for (const node of nodes) {
      if (node.type === "file") return node;
      if (node.children) {
        const found = findFirstFile(node.children);
        if (found) return found;
      }
    }
    return null;
  }

  //  open a file into tabs 
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

  // close a tab 
  function closeTab(filePath: string, e: React.MouseEvent) {
    e.stopPropagation();
    const idx = openFiles.findIndex((f) => f.path === filePath);
    const newOpen = openFiles.filter((f) => f.path !== filePath);
    setOpenFiles(newOpen);

    if (activeFile === filePath) {
      
      const next = newOpen[idx] || newOpen[idx - 1] || null;
      setActiveFile(next?.path ?? null);
    }
    if (filePath === activeFile) cleanupYjs();
  }

  // ── save file to server 
  const saveFile = useCallback(
    async (filePath: string, content: string) => {
      setSaveStatus("saving");
      try {
        const encodedPath = filePath.split("/").map(encodeURIComponent).join("/");
        await fetch(`http://localhost:8081/files/${projectId}/${encodedPath}`, {
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

  // editor onChange: update state + debounce save 
  function updateCode(value: string | undefined) {
    if (!activeFile) return;
    const content = value || "";

    setOpenFiles((prev) =>
      prev.map((f) => (f.path === activeFile ? { ...f, content, isDirty: true } : f))
    );
    setSaveStatus("unsaved");

    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      saveFile(activeFile, content);
    }, 600);
  }

  // Ctrl+S manual save 
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

  // create new file 
  const handleCreateFile = async () => {
    if (!newFileName.trim()) return;
    let name = newFileName.trim();
    if (!name.includes(".")) name += ".js";

    const content = "";

    try {
      const encodedName = encodeURIComponent(name);
      await fetch(`http://localhost:8081/files/${projectId}/${encodedName}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });

      const newNode: FileNode = { name, path: name, type: "file", content };
      setFileTree((prev) => [...prev, newNode]);
      openFile(newNode);
    } catch (err) {
      console.error("Create file failed:", err);
    }

    setNewFileName("");
    setIsCreating(false);
  };

  //  delete file 
  function deleteFile(file: OpenFile) {
   
    closeTab(file.path, { stopPropagation: () => {} } as React.MouseEvent);
    
    setFileTree((prev) => prev.filter((f) => f.path !== file.path));
    
  }

  //  rename 
  const saveRename = () => {
    if (!editingPath || !editName.trim()) return;
    setFileTree((prev) =>
      prev.map((f) => (f.path === editingPath ? { ...f, name: editName } : f))
    );
    setOpenFiles((prev) =>
      prev.map((f) => (f.path === editingPath ? { ...f, name: editName } : f))
    );
    setEditingPath(null);
    setEditName("");
  };

  //  run active file
  const runFile = async () => {
    if (!activeFile) return;
    const file = openFiles.find((f) => f.path === activeFile);
    if (!file) return;

    const socket = getSocket();
    if (!socket || socket.readyState !== WebSocket.OPEN) {
      alert("Terminal not connected. Open the floating terminal first.");
      return;
    }

    // save first, then run
    await saveFile(activeFile, file.content);

    const projectPath = `http://localhost:8081/files/${projectId}`;
    const res = await fetch("http://localhost:8081/run", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: file.content, name: file.name ,projectId }),
    });

    const { path: filePath } = await res.json();
    socket.send(`node "${filePath}"\r`);
  };

  //  active file object 
  const activeFileObj = openFiles.find((f) => f.path === activeFile) ?? null;

  // render file tree (recursive)
  function renderTree(nodes: FileNode[], depth = 0) {
    return nodes.map((node) => (
      <div key={node.path}>
        <div
          className={`flex items-center justify-between px-3 py-1.5 text-sm cursor-pointer group ${
            activeFile === node.path ? "bg-[#37373d]" : "hover:bg-[#2a2d2e]"
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
              <span className="text-xs opacity-50">
                {node.type === "folder" ? "▶" : ""}
              </span>
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
    
      <div className="w-12 bg-[#252526] flex flex-col items-center py-4 gap-6 text-gray-400">
        <span className="text-lg cursor-pointer hover:text-white">📁</span>
        <span className="text-lg cursor-pointer hover:text-white">🔍</span>
        <span className="text-lg cursor-pointer hover:text-white">⚙️</span>
      </div>

      <div className="w-56 bg-[#1e1e1e] border-r border-gray-700 flex flex-col">
        <div className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider flex justify-between items-center">
          Explorer
          <button
            onClick={() => setIsCreating(true)}
            className="text-gray-400 hover:text-white text-lg leading-none"
            title="New file"
          >
            +
          </button>
        </div>

        {isCreating && (
          <div className="px-3 py-1">
            <input
              autoFocus
              value={newFileName}
              onChange={(e) => setNewFileName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleCreateFile();
                if (e.key === "Escape") { setIsCreating(false); setNewFileName(""); }
              }}
              placeholder="filename.js"
              className="w-full px-2 py-1 text-sm bg-[#2a2d2e] outline-none rounded border border-blue-500"
            />
          </div>
        )}

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="px-3 py-4 text-xs text-gray-500">Loading files...</div>
          ) : (
            renderTree(fileTree)
          )}
        </div>
      </div>

     
      <div className="flex-1 flex flex-col min-w-0">

        
        <div className="flex bg-[#252526] border-b border-gray-700 overflow-x-auto min-h-[36px]">
          <div className="flex flex-1">
            {openFiles.map((file) => (
              <div
                key={file.path}
                onClick={() => setActiveFile(file.path)}
                className={`flex items-center gap-2 px-3 py-2 text-sm cursor-pointer border-r border-gray-700 whitespace-nowrap group ${
                  activeFile === file.path
                    ? "bg-[#1e1e1e] text-white border-t-2 border-t-blue-500"
                    : "bg-[#252526] text-gray-400 hover:text-white"
                }`}
              >
                <span>{file.name}</span>
                {file.isDirty && (
                  <span className="w-1.5 h-1.5 rounded-full bg-white opacity-70" />
                )}
                <span
                  onClick={(e) => closeTab(file.path, e)}
                  className="opacity-0 group-hover:opacity-60 hover:!opacity-100 text-xs leading-none"
                >
                  ✕
                </span>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-3 px-3">
            <span className="text-xs text-gray-500">
              {saveStatus === "saving" ? "Saving..." : saveStatus === "unsaved" ? "Unsaved" : ""}
            </span>
            {activeFile && (
              <button
                onClick={runFile}
                className="px-3 py-1 text-xs bg-green-700 hover:bg-green-600 rounded flex items-center gap-1"
              >
                ▶ Run
              </button>
            )}
          </div>
        </div>

       
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

        
        <div className="flex items-center justify-between px-4 py-0.5 bg-[#007acc] text-white text-xs">
          <span>Project: {projectId.slice(0, 8)}...</span>
          <span>{activeFileObj ? getLanguage(activeFileObj.name) : ""}</span>
        </div>
      </div>
    </div>
  );
}