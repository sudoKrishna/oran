"use client";

import { useState } from "react";
import { FileNode } from "../types";
import { fileIcon } from "../lib/utils";

type Props = {
  fileTree: FileNode[];
  activeFile: string | null;
  loading: boolean;
  projectId: string;
  onOpenFile: (node: FileNode) => void;
  onCreateFile: (name: string) => void;
};

function renderTree(
  nodes: FileNode[] | null | undefined,
  activeFile: string | null,
  onOpenFile: (node: FileNode) => void,
  editingPath: string | null,
  editName: string,
  setEditName: (v: string) => void,
  setEditingPath: (v: string | null) => void,
  saveRename: () => void,
  depth = 0
): React.ReactNode {
  if (!nodes?.length) return null;
  return nodes.map((node) => (
    <div key={`${node.path}-${depth}`}>
      <div
        className={`flex items-center gap-2 px-3 py-[5px] text-[13px] cursor-pointer rounded-lg mx-1 transition-all duration-150 group ${
          activeFile === node.path
            ? "bg-violet-500/15 text-violet-300 shadow-[inset_0_0_12px_rgba(139,92,246,0.08)]"
            : "text-gray-400 hover:bg-white/5 hover:text-white"
        }`}
        style={{ paddingLeft: `${12 + depth * 14}px` }}
        onClick={() => node.type === "file" && onOpenFile(node)}
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
            className="bg-[#1a1a2e] px-2 py-0.5 rounded w-full outline-none border border-violet-500/40 text-white text-[12px]"
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <>
            <span className="text-[10px] opacity-40 font-mono w-3 shrink-0">
              {node.type === "folder" ? "▶" : ""}
            </span>
            <span className="text-[11px] opacity-50 shrink-0">{fileIcon(node.name)}</span>
            <span className="truncate font-mono text-[12.5px]">{node.name}</span>
          </>
        )}
      </div>
      {node.type === "folder" && node.children && (
        <div className="border-l border-white/5 ml-5">
          {renderTree(
            node.children, activeFile, onOpenFile,
            editingPath, editName, setEditName, setEditingPath, saveRename,
            depth + 1
          )}
        </div>
      )}
    </div>
  ));
}

export default function Sidebar({
  fileTree, activeFile, loading, projectId, onOpenFile, onCreateFile,
}: Props) {
  const [isCreating, setIsCreating] = useState(false);
  const [newFileName, setNewFileName] = useState("");
  const [editingPath, setEditingPath] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  const handleCreate = () => {
    if (!newFileName.trim()) return;
    let name = newFileName.trim();
    if (!name.includes(".")) name += ".js";
    onCreateFile(name);
    setNewFileName("");
    setIsCreating(false);
  };

  const saveRename = () => {
    // Rename is handled in parent; local reset only
    setEditingPath(null);
    setEditName("");
  };

  return (
    <div className="relative z-10 flex flex-col rounded-xl m-2 ml-0 bg-[rgba(16,16,30,0.75)] backdrop-blur-[24px] saturate-[160%] border border-white/[0.06]"
      style={{ width: 240, flexShrink: 0 }}>
      {/* Header */}
      <div className="flex items-center justify-between px-[14px] pt-3 pb-2 border-b border-white/[0.06]">
        <span className="text-[10px] font-semibold tracking-[0.12em] uppercase text-gray-500">
          Explorer
        </span>
        <button
          onClick={() => setIsCreating(true)}
          className="w-5 h-5 flex items-center justify-center rounded-[5px] border border-white/[0.06] bg-transparent text-gray-500 cursor-pointer text-sm leading-none transition-all hover:text-violet-400 hover:border-violet-500/30"
          title="New file"
        >
          +
        </button>
      </div>

      {/* New file input */}
      {isCreating && (
        <div className="px-[10px] py-2">
          <input
            autoFocus
            value={newFileName}
            onChange={(e) => setNewFileName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleCreate();
              if (e.key === "Escape") { setIsCreating(false); setNewFileName(""); }
            }}
            placeholder="filename.js"
            className="w-full px-[10px] py-[5px] bg-[#14142a] border border-violet-500/30 rounded-[6px] outline-none text-white text-[12px] font-mono"
          />
        </div>
      )}

      {/* Project chip */}
      <div className="mx-[10px] my-2 px-[10px] py-1 rounded-[6px] bg-violet-500/[0.12] border border-violet-500/[0.15] text-[11px] text-violet-400 font-mono flex items-center gap-[6px]">
        <span className="opacity-50 text-[10px]">⬡</span>
        {projectId.slice(0, 12)}…
      </div>

      {/* File tree */}
      <div
        className="flex-1 overflow-y-auto py-1 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-violet-500/20 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent"
      >
        {loading ? (
          <div className="px-[14px] py-4 text-[12px] text-gray-500">Loading files…</div>
        ) : (
          renderTree(
            fileTree, activeFile, onOpenFile,
            editingPath, editName, setEditName, setEditingPath, saveRename
          )
        )}
      </div>
    </div>
  );
}