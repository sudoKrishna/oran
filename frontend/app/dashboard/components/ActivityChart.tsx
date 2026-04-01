import { useEffect, useRef } from "react";
import gsap from "gsap";

const data = [32, 45, 28, 55, 42, 67, 53, 72, 48, 85, 62, 90];
const labels = ["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"];

const ActivityChart = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const barsRef = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    gsap.fromTo(container, { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8, delay: 0.5, ease: "power3.out" });

    barsRef.current.forEach((bar, i) => {
      if (!bar) return;
      gsap.fromTo(bar, { scaleY: 0 }, { scaleY: 1, duration: 0.7, delay: 0.7 + i * 0.05, ease: "elastic.out(1, 0.6)", transformOrigin: "bottom" });
    });
  }, []);

  const max = Math.max(...data);

  return (
    <div ref={containerRef} className="sandbox-card p-5 opacity-0 h-full">
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-sm font-semibold text-foreground">Activity</h3>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full neon-bg-cyan" />
          <span className="mono text-[10px] text-muted-foreground">live</span>
        </div>
      </div>
      <p className="text-xs text-muted-foreground mono mb-5">requests / month</p>
      <div className="flex items-end gap-1.5 h-36">
        {data.map((val, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
            <div className="w-full relative" style={{ height: `${(val / max) * 100}%` }}>
              <div
                ref={(el) => { barsRef.current[i] = el; }}
                className="w-full h-full rounded-sm transition-all duration-200 cursor-pointer hover:opacity-100 opacity-70"
                style={{
                  background: `linear-gradient(to top, hsl(var(--neon-cyan) / 0.3), hsl(var(--neon-cyan) / 0.8))`,
                }}
              />
            </div>
            <span className="mono text-[9px] text-muted-foreground">{labels[i]}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ActivityChart;
