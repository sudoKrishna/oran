"use client";

import { X, Send, Sparkles } from "lucide-react";
import { AiTab, AiMessage } from "../types";

type Props = {
  panelRef: React.RefObject<HTMLDivElement | null>;
  isAiLoading: boolean;
  aiTab: AiTab;
  setAiTab: (tab: AiTab) => void;
  aiMessages: AiMessage[];
  aiResponse: string;
  aiWarning: string | null;
  aiPrompt: string;
  setAiPrompt: (v: string) => void;
  onClose: () => void;
  onAsk: (prompt: string) => void;
};

const QUICK_ACTIONS = [
  { label: "Explain", prompt: "Explain this code clearly" },
  { label: "Debug", prompt: "Find bugs and suggest fixes" },
  { label: "Improve", prompt: "Suggest improvements or refactoring" },
  { label: "+ Types", prompt: "Add proper TypeScript types where missing" },
];

export default function AiPanel({
  panelRef, isAiLoading, aiTab, setAiTab,
  aiMessages, aiResponse, aiWarning, aiPrompt, setAiPrompt,
  onClose, onAsk,
}: Props) {
  return (
    <div
      ref={panelRef}
      className="relative z-10 flex flex-col rounded-xl m-2 ml-0 bg-[rgba(16,16,30,0.75)] backdrop-blur-[24px] border border-white/[0.06] overflow-hidden"
      style={{ width: 0, flexShrink: 0 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-[14px] py-3 border-b border-white/[0.06] shrink-0">
        <div className="flex items-center gap-[7px]">
          <Sparkles size={13} className="text-violet-400" />
          <span className="text-[13px] font-semibold text-slate-200 whitespace-nowrap">ORAN AI</span>
          {isAiLoading && (
            <span className="text-[10px] text-amber-400 whitespace-nowrap animate-pulse">
              analyzing…
            </span>
          )}
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-[5px] bg-transparent border-none text-gray-500 cursor-pointer hover:text-white transition-colors"
        >
          <X size={13} />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/[0.06] shrink-0">
        {(["issues", "suggest", "chat"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setAiTab(tab)}
            className={`relative flex-1 py-2 px-1 text-[11.5px] font-medium capitalize bg-transparent border-none cursor-pointer transition-colors whitespace-nowrap ${
              aiTab === tab ? "text-violet-400" : "text-gray-500 hover:text-gray-300"
            }`}
          >
            {tab}
            {aiTab === tab && (
              <span className="absolute bottom-0 left-[10%] right-[10%] h-[2px] rounded-[1px] bg-gradient-to-r from-transparent via-violet-500 to-transparent" />
            )}
          </button>
        ))}
      </div>

      {/* Body */}
      <div
        className="flex-1 overflow-y-auto p-3 flex flex-col gap-2 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-violet-500/20 [&::-webkit-scrollbar-thumb]:rounded-full"
      >
        {aiTab === "chat" && (
          <>
            {aiMessages.length === 0 && !isAiLoading && (
              <div className="text-center px-4 py-8">
                <div className="w-10 h-10 rounded-full bg-violet-500/[0.12] mx-auto mb-3 flex items-center justify-center">
                  <Sparkles size={18} className="text-violet-500/50" />
                </div>
                <p className="text-[12px] text-gray-500 leading-relaxed whitespace-pre-line">
                  {"Use a quick action below\nor ask about your code."}
                </p>
              </div>
            )}

            {aiWarning && (
              <div className="px-[10px] py-2 rounded-[8px] bg-amber-400/[0.08] border border-amber-400/20 text-[11.5px] text-amber-400">
                {aiWarning}
              </div>
            )}

            {aiMessages.map((msg, i) => (
              <div
                key={i}
                className={`rounded-[10px] p-[10px_12px] text-[11.5px] leading-[1.65] font-mono ${
                  msg.role === "user"
                    ? "bg-violet-500/[0.12] border border-violet-500/[0.15] text-violet-300 ml-6 ai-msg-new"
                    : "bg-[#14142a] border border-white/[0.06] text-slate-200 mr-6 ai-msg-new"
                }`}
              >
                <pre className="whitespace-pre-wrap m-0 font-mono text-[11px]">{msg.content}</pre>
              </div>
            ))}

            {isAiLoading && (
              <div className="flex gap-1 px-3 py-2 items-center">
                {[0, 150, 300].map((delay, i) => (
                  <span
                    key={i}
                    className="w-[5px] h-[5px] rounded-full bg-violet-500 inline-block"
                    style={{ animation: `bounce 0.8s ${delay}ms ease-in-out infinite` }}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {(aiTab === "issues" || aiTab === "suggest") && (
          <div className="flex flex-col gap-2">
            <p className="text-[12px] text-gray-500 leading-relaxed">
              {aiTab === "issues"
                ? "Click Debug below to review issues in the current file."
                : "Click Improve below to get refactoring suggestions."}
            </p>
            {aiResponse && (
              <div className="p-[10px_12px] rounded-[8px] bg-[#14142a] border border-white/[0.06] text-[11.5px] text-slate-200 font-mono leading-[1.65]">
                {aiResponse}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Quick actions + prompt */}
      <div className="border-t border-white/[0.06] p-[10px_12px] flex flex-col gap-2 shrink-0">
        <div className="flex flex-wrap gap-[5px]">
          {QUICK_ACTIONS.map(({ label, prompt }) => (
            <button
              key={label}
              onClick={() => { setAiTab("chat"); onAsk(prompt); }}
              disabled={isAiLoading}
              className="px-[10px] py-1 text-[11px] rounded-[6px] border border-white/[0.06] bg-[#10101e] text-gray-500 cursor-pointer transition-all hover:text-violet-400 hover:border-violet-500/30 hover:bg-violet-500/[0.12] disabled:opacity-35 disabled:cursor-not-allowed"
            >
              {label}
            </button>
          ))}
        </div>

        <div className="flex gap-[6px] items-end">
          <textarea
            rows={2}
            value={aiPrompt}
            onChange={(e) => setAiPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                if (aiPrompt.trim()) { setAiTab("chat"); onAsk(aiPrompt.trim()); }
              }
            }}
            placeholder="Ask about this file…"
            className="flex-1 bg-[#14142a] border border-white/[0.06] rounded-[8px] px-[10px] py-[7px] text-[12px] text-slate-200 font-mono outline-none resize-none leading-[1.5] transition-colors focus:border-violet-500/35"
          />
          <button
            onClick={() => { if (aiPrompt.trim()) { setAiTab("chat"); onAsk(aiPrompt.trim()); } }}
            disabled={isAiLoading || !aiPrompt.trim()}
            className="w-8 h-8 rounded-[8px] border-none text-white flex items-center justify-center transition-all shrink-0 disabled:opacity-40"
            style={{
              background: aiPrompt.trim() ? "#8b5cf6" : "rgba(139,92,246,0.12)",
              cursor: isAiLoading || !aiPrompt.trim() ? "not-allowed" : "pointer",
            }}
          >
            <Send size={12} />
          </button>
        </div>
      </div>
    </div>
  );
}