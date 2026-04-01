import { useEffect, useRef } from "react";
import gsap from "gsap";

const TerminalWidget = () => {
  const ref = useRef<HTMLDivElement>(null);
  const linesRef = useRef<(HTMLDivElement | null)[]>([]);

  const lines = [
    { text: "sandbox init --project dashboard", dim: false },
    { text: "✓ Connected to database", dim: true },
    { text: "✓ Auth provider configured", dim: true },
    { text: "✓ API endpoints ready", dim: true },
    { text: "listening on :3000", dim: false },
  ];

  useEffect(() => {
    if (!ref.current) return;
    gsap.fromTo(ref.current, { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8, delay: 0.7, ease: "power3.out" });

    linesRef.current.forEach((line, i) => {
      if (!line) return;
      gsap.fromTo(line, { opacity: 0, x: -10 }, { opacity: 1, x: 0, duration: 0.3, delay: 0.9 + i * 0.15, ease: "power2.out" });
    });
  }, []);

  return (
    <div ref={ref} className="sandbox-card p-5 opacity-0">
      <div className="flex items-center gap-2 mb-4">
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full neon-bg-pink opacity-80" />
          <div className="w-2.5 h-2.5 rounded-full neon-bg-amber opacity-80" />
          <div className="w-2.5 h-2.5 rounded-full neon-bg-green opacity-80" />
        </div>
        <span className="mono text-[10px] text-muted-foreground ml-2">terminal</span>
      </div>
      <div className="space-y-1.5">
        {lines.map((line, i) => (
          <div
            key={i}
            ref={(el) => { linesRef.current[i] = el; }}
            className={`mono text-xs opacity-0 ${line.dim ? "text-muted-foreground" : "neon-text-cyan"}`}
          >
            <span className="text-muted-foreground mr-2">{i === lines.length - 1 ? "→" : "$"}</span>
            {line.text}
          </div>
        ))}
        <div className="mono text-xs neon-text-cyan flex items-center mt-2">
          <span className="text-muted-foreground mr-2">$</span>
          <span className="w-1.5 h-4 neon-bg-cyan animate-pulse" />
        </div>
      </div>
    </div>
  );
};

export default TerminalWidget;
