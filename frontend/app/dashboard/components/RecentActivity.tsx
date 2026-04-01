import { useEffect, useRef } from "react";
import gsap from "gsap";

const activities = [
  { status: "success", title: "deploy.prod", desc: "Build completed in 2.4s", time: "2m", color: "neon-bg-green" },
  { status: "info", title: "auth.signup", desc: "sarah.chen@email.com", time: "15m", color: "neon-bg-cyan" },
  { status: "success", title: "payment.received", desc: "inv_1092 — $1,280.00", time: "1h", color: "neon-bg-green" },
  { status: "warning", title: "api.rate_limit", desc: "85% threshold reached", time: "3h", color: "neon-bg-amber" },
  { status: "info", title: "db.migration", desc: "Schema v4.2 applied", time: "5h", color: "neon-bg-cyan" },
];

const RecentActivity = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const itemsRef = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    gsap.fromTo(container, { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8, delay: 0.6, ease: "power3.out" });

    itemsRef.current.forEach((item, i) => {
      if (!item) return;
      gsap.fromTo(item, { x: -15, opacity: 0 }, { x: 0, opacity: 1, duration: 0.4, delay: 0.8 + i * 0.08, ease: "power2.out" });
    });
  }, []);

  return (
    <div ref={containerRef} className="sandbox-card p-5 opacity-0 h-full">
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-sm font-semibold text-foreground">Event Log</h3>
        <span className="mono text-[10px] text-muted-foreground px-2 py-0.5 rounded bg-secondary">tail -f</span>
      </div>
      <p className="text-xs text-muted-foreground mono mb-4">recent events</p>
      <div className="space-y-1">
        {activities.map((item, i) => (
          <div
            key={i}
            ref={(el) => { itemsRef.current[i] = el; }}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-secondary/60 transition-colors cursor-pointer opacity-0 group"
          >
            <div className={`w-1.5 h-1.5 rounded-full ${item.color} shrink-0`} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="mono text-xs font-medium text-foreground">{item.title}</span>
              </div>
              <p className="text-[11px] text-muted-foreground truncate mt-0.5">{item.desc}</p>
            </div>
            <span className="mono text-[10px] text-muted-foreground whitespace-nowrap">{item.time}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RecentActivity;
