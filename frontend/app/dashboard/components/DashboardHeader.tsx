import { useEffect, useRef } from "react";
import gsap from "gsap";

const DashboardHeader = () => {
  const headerRef = useRef<HTMLDivElement>(null);
  const dotRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = headerRef.current;
    if (!el) return;
    gsap.fromTo(el, { y: -30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8, ease: "power3.out" });
  }, []);

  useEffect(() => {
    if (!dotRef.current) return;
    gsap.fromTo(dotRef.current, { scale: 0 }, { scale: 1, duration: 0.4, delay: 0.6, ease: "back.out(3)" });
  }, []);

  return (
    <div ref={headerRef} className="flex items-center justify-between opacity-0">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg neon-bg-cyan flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="hsl(225 25% 8%)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
          </div>
          <span className="sandbox-title text-foreground">sandbox</span>
          <div ref={dotRef} className="dot-indicator neon-bg-cyan scale-0" />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <div className="sandbox-card px-3 py-1.5 flex items-center gap-2 cursor-pointer hover:border-primary/40 transition-colors">
          <span className="mono text-xs text-muted-foreground">⌘K</span>
        </div>
        <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center text-muted-foreground cursor-pointer hover:text-foreground transition-colors">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
        </div>
        <div className="w-8 h-8 rounded-lg border border-primary/40 flex items-center justify-center neon-text-cyan text-xs font-bold mono cursor-pointer">
          JD
        </div>
      </div>
    </div>
  );
};

export default DashboardHeader;
