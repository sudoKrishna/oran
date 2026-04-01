import { useEffect, useRef } from "react";
import gsap from "gsap";

interface SidebarItem {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  isUpgrade?: boolean;
}

interface SidebarSection {
  title: string;
  items: SidebarItem[];
}

// Icons
const iconClock = <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>;
const iconSettings = <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>;
const iconUsers = <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>;
const iconRocket = <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/></svg>;
const iconMonitor = <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>;
const iconFile = <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>;
const iconGit = <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="18" r="3"/><circle cx="6" cy="6" r="3"/><circle cx="18" cy="6" r="3"/><path d="M18 9v1a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V9"/><path d="M12 12v3"/></svg>;
const iconEdit = <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>;
const iconFolder = <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>;
const iconTrash = <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>;

// Sidebar sections
const sections: SidebarSection[] = [
  {
    title: "",
    items: [
      { icon: iconClock, label: "Recent", active: true },
      { icon: iconSettings, label: "Settings" },
      { icon: iconUsers, label: "Invite members" },
      { icon: iconRocket, label: "Get started" },
      { icon: iconMonitor, label: "Upgrade", isUpgrade: true },
    ],
  },
  {
    title: "Repositories",
    items: [
      { icon: iconFile, label: "All repositories" },
      { icon: iconGit, label: "My contributions" },
    ],
  },
  {
    title: "Devboxes and Sandboxes",
    items: [
      { icon: iconEdit, label: "Drafts" },
      { icon: iconFolder, label: "All folders" },
      { icon: iconTrash, label: "Recently deleted" },
    ],
  },
];

const Sidebar = () => {
  const sidebarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!sidebarRef.current) return;
    gsap.fromTo(
      sidebarRef.current,
      { x: -40, opacity: 0 },
      { x: 0, opacity: 1, duration: 0.6, ease: "power3.out" }
    );
  }, []);

  return (
    <aside
      ref={sidebarRef}
      className="w-64 h-screen flex flex-col border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 opacity-0 shrink-0"
    >
      {/* Workspace */}
      <div className="px-3 py-3 flex items-center gap-2 cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded transition">
        <div className="w-7 h-7 rounded border border-zinc-300 dark:border-zinc-700 flex items-center justify-center">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/></svg>
        </div>
        <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">my-workspace</span>
        <svg className="ml-auto" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
      </div>

      {/* Nav sections */}
      <nav className="flex-1 overflow-y-auto px-2 pb-4">
        {sections.map((section, si) => (
          <div key={si} className="mt-4">
            {section.title && <div className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase px-2 mb-2">{section.title}</div>}
            {section.items.map((item, ii) => (
              <div
                key={ii}
                className={`flex items-center gap-2 px-2 py-2 rounded cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800 transition ${
                  item.active ? "bg-blue-100 dark:bg-blue-900 font-semibold text-blue-700 dark:text-blue-400" : "text-zinc-700 dark:text-zinc-300"
                }`}
              >
                <span className={item.isUpgrade ? "text-blue-600 dark:text-blue-400" : ""}>{item.icon}</span>
                <span className={item.isUpgrade ? "text-blue-600 dark:text-blue-400" : ""}>{item.label}</span>
              </div>
            ))}
          </div>
        ))}
      </nav>

      {/* Credits */}
      <div className="px-3 py-3 border-t border-zinc-200 dark:border-zinc-800">
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-2">1 / 400 credits</p>
        <div className="w-full h-1 rounded-full bg-zinc-200 dark:bg-zinc-700 overflow-hidden">
          <div className="h-full rounded-full bg-blue-600 dark:bg-blue-400" style={{ width: "0.25%" }} />
        </div>
        <div className="flex items-center gap-4 mt-2">
          <span className="text-xs text-blue-600 dark:text-blue-400 cursor-pointer">Upgrade</span>
          <span className="text-xs text-zinc-500 dark:text-zinc-400 cursor-pointer hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">View usage</span>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;