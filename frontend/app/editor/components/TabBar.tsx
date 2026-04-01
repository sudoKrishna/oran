"use client";

import { Sparkles } from "lucide-react";
import { OpenFile } from "../types";
import { fileIcon } from "../lib/utils";

type Props = {
  openFiles: OpenFile[];
  activeFile: string | null;
  saveStatus: "saved" | "saving" | "unsaved";
  isAiLoading: boolean;
  showAiPanel: boolean;
  orbRef: React.RefObject<HTMLSpanElement | null>;
  onTabClick: (path: string) => void;
  onCloseTab: (path: string, e: React.MouseEvent) => void;
  onRun: () => void;
  onToggleAi: () => void;
};

export default function TabBar({
  openFiles, activeFile, saveStatus, isAiLoading, showAiPanel,
  orbRef, onTabClick, onCloseTab, onRun, onToggleAi,
}: Props) {
  return (
    <div className="relative z-10 mx-2 mt-2 rounded-xl bg-[rgba(16,16,30,0.75)] backdrop-blur-[24px] border border-white/[0.06] overflow-hidden flex items-stretch"
      style={{ height: 40 }}>
      {/* Tabs */}
      <div className="flex flex-1 overflow-x-auto">
        {openFiles.map((file) => (
          <div
            key={file.path}
            onClick={() => onTabClick(file.path)}
            className={`relative flex items-center gap-[7px] px-[14px] h-full text-[12.5px] cursor-pointer border-r border-white/[0.06] font-mono whitespace-nowrap transition-all duration-150 ${
              activeFile === file.path
                ? "text-white bg-violet-500/[0.06] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-px after:bg-gradient-to-r after:from-transparent after:via-violet-500 after:to-transparent"
                : "text-gray-500 hover:text-slate-200 hover:bg-white/[0.03]"
            }`}
          >
            <span className="text-[10px] opacity-50">{fileIcon(file.name)}</span>
            <span>{file.name}</span>
            {file.isDirty && (
              <span className="w-[5px] h-[5px] rounded-full bg-violet-500 shrink-0" />
            )}
            <span
              onClick={(e) => onCloseTab(file.path, e)}
              className="text-[11px] leading-none px-[2px] rounded-[3px] cursor-pointer opacity-0 hover:opacity-100 hover:bg-white/10 transition-opacity duration-150"
            >
              ✕
            </span>
          </div>
        ))}
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-2 px-3 border-l border-white/[0.06]">
        {/* Save status */}
        <span className={`text-[11px] font-mono transition-colors duration-300 ${
          saveStatus === "unsaved" ? "text-amber-400"
            : saveStatus === "saving" ? "text-gray-500"
              : "text-transparent"
        }`}>
          {saveStatus === "saving" ? "saving…" : saveStatus === "unsaved" ? "●" : ""}
        </span>

        {activeFile && (
          <button
            onClick={onRun}
            className="flex items-center gap-[5px] px-3 py-[3px] rounded-[6px] text-[11.5px] font-medium text-white bg-gradient-to-br from-emerald-600 to-emerald-700 border border-emerald-400/20 cursor-pointer transition-all hover:from-emerald-500 hover:to-emerald-600 hover:scale-[1.02]"
          >
            <span className="text-[9px]">▶</span> Run
          </button>
        )}

        {activeFile && (
          <button
            onClick={onToggleAi}
            className={`flex items-center gap-[6px] px-3 py-[3px] rounded-[6px] text-[11.5px] font-medium cursor-pointer transition-all ${
              showAiPanel
                ? "bg-violet-500/25 text-violet-300 border border-violet-500/35"
                : "bg-violet-500/[0.12] text-violet-400 border border-violet-500/20 hover:bg-violet-500/20"
            }`}
          >
            <span
              ref={orbRef}
              className="w-[7px] h-[7px] rounded-full inline-block transition-colors duration-300"
              style={{
                background: isAiLoading ? "#fbbf24" : "#8b5cf6",
              }}
            />
            AI
            <Sparkles size={11} />
          </button>
        )}
      </div>
    </div>
  );
}