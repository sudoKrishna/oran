"use client";

import { ActiveUser } from "../types";

type Props = {
  projectId: string;
  activeUsers: ActiveUser[];
  language: string;
};

export default function StatusBar({ projectId, activeUsers, language }: Props) {
  return (
    <div
      className="mx-2 flex items-center justify-between px-3 font-mono text-[11px] text-white/70 flex-shrink-0"
      style={{
        height: 22,
        background: "linear-gradient(90deg, #5b21b6, #4c1d95)",
        borderRadius: "0 0 12px 12px",
      }}
    >
      <div className="flex items-center gap-[14px]">
        <span>⬡ {projectId.slice(0, 8)}…</span>
        {activeUsers.length > 0 && (
          <span className="flex gap-1 items-center">
            {activeUsers.slice(0, 4).map((u) => (
              <span
                key={u.userId}
                className="w-[14px] h-[14px] rounded-full border border-white/20 inline-block"
                style={{ background: u.color }}
                title={u.name ?? u.email ?? "?"}
              />
            ))}
            <span className="opacity-60">{activeUsers.length} live</span>
          </span>
        )}
      </div>
      <div className="flex gap-[14px] items-center">
        <span>{language}</span>
        <span>UTF-8</span>
        <span>LF</span>
      </div>
    </div>
  );
}