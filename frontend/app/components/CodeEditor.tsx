"use client";

import { getSocket } from "@/lib/terminalSocket";
import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";

const Editor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
});

type FileType = {
  name: string;
  content: string;
};

export default function VSCodeUI() {
  const [files, setFiles] = useState<FileType[]>([]);
  const [activeFile, setActiveFile] = useState<number | null>(null);

  const [isCreating, setIsCreating] = useState(false);
  const [newFileName, setNewFileName] = useState("");

  // rename state
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editName, setEditName] = useState("");

  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    containerRef.current?.focus();
  }, []);

  const handleCreateFile = () => {
    if (!newFileName.trim()) return;

    let name = newFileName.trim();

    if (!name.endsWith(".js")) {
      name += ".js"
    }

    const newFile: FileType = {
      name,
      content: "",
    };

    setFiles((prev) => [...prev, newFile]);
    setActiveFile(files.length);

    setNewFileName("");
    setIsCreating(false);
  };

  //  update code
  const updateCode = (value: string | undefined) => {
    if (activeFile === null) return;

    const newFiles = files.map((file, index) =>
      index === activeFile
        ? { ...file, content: value || "" }
        : file
    );

    setFiles(newFiles);
  };

  //  delete file
  const deleteFile = (index: number) => {
    const newFiles = files.filter((_, i) => i !== index);

    setFiles(newFiles);

    // adjust active file
    if (index === activeFile) {
      setActiveFile(null);
    } else if (activeFile !== null && index < activeFile) {
      setActiveFile(activeFile - 1);
    }
  };

  //  start rename
  const startRename = (index: number, currentName: string) => {
    setEditingIndex(index);
    setEditName(currentName);
  };

  //  save rename
  const saveRename = () => {
    if (editingIndex === null || !editName.trim()) return;

    const newFiles = files.map((file, index) =>
      index === editingIndex ? { ...file, name: editName } : file
    );

    setFiles(newFiles);
    setEditingIndex(null);
    setEditName("");
  };

  const runFile = async () => {
    if (activeFile === null) return;
    const file = files[activeFile];
    const socket = getSocket();

    if (!socket || socket.readyState !== WebSocket.OPEN) {
      alert('Terminal not connected. Open the floating terminal first.')
      return;
    }

    // Write file via HTTP (safe, no escaping issues)
    const res = await fetch("http://localhost:8081/run", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: file.content }),
    });

    const { path } = await res.json();

    // Then run it in the terminal
    socket.send(`node "${path}"\r`);

  }

  return (
    <div ref={containerRef}
      tabIndex={0}
      className="h-screen flex bg-[#1e1e1e] text-white"
      onKeyDown={(e) => {
        if (e.key === "Delete" && activeFile !== null) {
          deleteFile(activeFile)
        }
        if (e.key === "F2" && activeFile !== null) {
          const currentFile = files[activeFile];
          startRename(activeFile, currentFile.name)
        }


      }}
    >

      {/* Sidebar */}
      <div className="w-16 bg-[#252526] flex flex-col items-center py-4 gap-4">
        <div>📁</div>
        <div>🔍</div>
        <div>⚙️</div>
      </div>

      {/* File Explorer */}
      <div className="w-60 bg-[#1e1e1e] border-r border-gray-700">
        <div className="p-3 text-sm font-semibold flex justify-between items-center">
          EXPLORER
          <button
            onClick={() => setIsCreating(true)}
            className="text-xs bg-blue-600 px-2 py-1 rounded hover:bg-blue-500"
          >
            + File
          </button>
        </div>

        {/* create input */}
        {isCreating && (
          <div className="px-3 py-2">
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
              placeholder="Enter file name..."
              className="w-full px-2 py-1 text-sm bg-[#2a2d2e] outline-none rounded"
            />
          </div>
        )}

        {files.map((file, index) => (
          <div
            key={index}
            className={`flex items-center justify-between px-3 py-2 text-sm ${activeFile === index
              ? "bg-[#37373d]"
              : "hover:bg-[#2a2d2e]"
              }`}
          >
            {/* file name / rename input */}
            {editingIndex === index ? (
              <input
                autoFocus
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") saveRename();
                  if (e.key === "Escape") setEditingIndex(null);
                }}
                className="bg-[#2a2d2e] px-1 rounded w-full mr-2"
              />
            ) : (
              <span
                onClick={() => setActiveFile(index)}
                className="flex-1 cursor-pointer"
              >
                {file.name}
              </span>
            )}
          </div>
        ))}
        <div className="flex border-b items-center justify-center border-gray-700 bg-[#2d2d2d]">
          <div className="flex">
            {files.map((file, index) => (
              <div key={index}
                onClick={() => setActiveFile(index)}
                className={`px-4 py-2 text-sm cursor-pointer border-r border-gray-700 ${activeFile === index ? "bg-[#1e1e1e]" : "bg-[#2d2d2d]"
                  }`}
              >
                {file.name}
              </div>
            ))}
          </div>
          {activeFile !== null && (
            <button onClick={runFile}
              className="mr-3 px-3 py-1 text-xs bg-green-600 hover:bg-green-500 rounded flex items-center gap-1">
              ▶ Run
            </button>
          )}

        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 flex flex-col">
        <div className="flex bg-[#2d2d2d] border-b border-gray-700">
          {files.map((file, index) => (
            <div
              key={index}
              onClick={() => setActiveFile(index)}
              className={`px-4 py-2 text-sm cursor-pointer border-r border-gray-700 ${activeFile === index
                ? "bg-[#1e1e1e]"
                : "bg-[#2d2d2d]"
                }`}
            >
              {file.name}
            </div>
          ))}
        </div>

        <div className="flex-1">
          {activeFile !== null ? (
            <Editor
              height="100%"
              language="javascript"
              theme="vs-dark"
              value={files[activeFile]?.content}
              onChange={updateCode}
            />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-400">
              Create a file to start coding
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
