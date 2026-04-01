import { useEffect, useRef } from "react";
import gsap from "gsap";

const TopBar = ({ session }: any) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    gsap.fromTo(
      ref.current,
      { y: -20, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.5, delay: 0.2, ease: "power3.out" }
    );
  }, []);

  return (
    <header
      ref={ref}
      className="h-14 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between px-4 opacity-0"
    >
      <div />

      <div className="flex items-center gap-2">
        {/* Search */}
        <div className="w-56 cursor-pointer flex items-center gap-2 px-3 py-1.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition">
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <span className="text-sm">Search in workspace</span>
        </div>

        {/* Import Button */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-blue-50 text-blue-600 hover:bg-blue-100 transition cursor-pointer">
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <path d="M12 8v8M8 12h8" />
          </svg>
          Import
        </div>

        {/* Create Button */}
        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-blue-600 text-white hover:bg-blue-700 hover:scale-105 active:scale-95 transition-all">
          <span>+</span> Create
        </button>

        {/* Notification */}
        <div className="w-8 h-8 flex items-center justify-center cursor-pointer text-zinc-500 hover:text-blue-600 transition-colors">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
        </div>

        {/* Avatar */}
        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center cursor-pointer overflow-hidden text-sm font-medium">
          {session?.user?.email
            ? session.user.email.charAt(0).toUpperCase()
            : "?"}
        </div>
      </div>
    </header>
  );
};

export default TopBar;