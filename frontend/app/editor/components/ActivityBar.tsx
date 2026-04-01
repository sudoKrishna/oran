"use client";

import { Folder, Search, Settings } from "lucide-react";

type Props = {
  userInitial: string;
};

const NAV_ITEMS = [
  { icon: Folder, label: "Explorer" },
  { icon: Search, label: "Search" },
  { icon: Settings, label: "Settings" },
];

export default function ActivityBar({ userInitial }: Props) {
  return (
    <div
      className="relative z-10 flex flex-col items-center py-4 gap-2 rounded-xl m-2 bg-[rgba(16,16,30,0.75)] backdrop-blur-[24px] border border-white/[0.06]"
      style={{ width: 52, flexShrink: 0 }}
    >
      {NAV_ITEMS.map((item, i) => {
        const Icon = item.icon;

        return (
          <div
            key={i}
            title={item.label}
            className={`w-9 h-9 flex items-center justify-center rounded-[10px] cursor-pointer transition-all duration-150 ${
              i === 0
                ? "text-violet-400 bg-violet-500/[0.12]"
                : "text-gray-500 hover:text-white hover:bg-violet-500/[0.12]"
            }`}
          >
            <Icon size={18} />
          </div>
        );
      })}

      <div className="flex-1" />

      {/* User avatar */}
      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-violet-800 flex items-center justify-center text-[11px] text-white font-semibold border-2 border-violet-500/30">
        {userInitial}
      </div>
    </div>
  );
}