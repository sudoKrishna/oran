"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const codeLines = [
  "function merge(a, b) {",
  "  const result = {};",
  "  for (const key of Object.keys(a)) {",
  "    result[key] = b[key] ?? a[key];",
  "  }",
  "  return result;",
  "}",
];

const MultiUserSection = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<HTMLDivElement>(null);
  const linesRef = useRef<HTMLDivElement>(null);
  const cursorsRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const lines = linesRef.current
        ? Array.from(linesRef.current.children)
        : [];

      const cursors = cursorsRef.current
        ? Array.from(cursorsRef.current.children)
        : [];

      // 🔥 ONE timeline to rule everything
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top top",
          end: "bottom bottom",
          scrub: 0.5,
          pin: editorRef.current,
        },
      });

      // Code lines (stagger = cheap)
      tl.fromTo(
        lines,
        { opacity: 0, y: 10 },
        {
          opacity: 1,
          y: 0,
          stagger: 0.12,
          duration: 0.6,
        }
      );

      // Cursors (batch animate)
      tl.fromTo(
        cursors,
        {
          x: (i: number) => [-80, 120, -120][i] || 0,
          y: (i: number) => [-40, -60, 80][i] || 0,
          opacity: 0,
          scale: 0.6,
        },
        {
          x: 0,
          y: 0,
          opacity: 1,
          scale: 1,
          stagger: 0.1,
          duration: 0.6,
        },
        "-=0.4"
      );

      // Text
      tl.fromTo(
        textRef.current,
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.8 }
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="relative min-h-[200vh]">
      <div
        ref={editorRef}
        className="h-screen flex flex-col items-center justify-center gap-12 px-6"
      >
        {/* Editor */}
        <div className="w-full max-w-2xl bg-card border border-border rounded-xl overflow-hidden">
          {/* Title */}
          <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
            <div className="w-3 h-3 rounded-full bg-destructive/60" />
            <div className="w-3 h-3 rounded-full bg-cursor-orange/60" />
            <div className="w-3 h-3 rounded-full bg-cursor-green/60" />
            <span className="ml-3 text-xs text-muted-foreground">merge.ts</span>
          </div>

          {/* Code */}
          <div className="p-6 font-mono text-sm relative">
            <div ref={linesRef}>
              {codeLines.map((line, i) => (
                <div
                  key={i}
                  className="flex items-center h-7 opacity-0"
                >
                  <span className="text-muted-foreground/40 w-6 text-right mr-4 text-xs">
                    {i + 1}
                  </span>
                  <span className="text-foreground/90">{line}</span>
                </div>
              ))}
            </div>

            {/* Cursors container */}
            <div ref={cursorsRef} className="absolute inset-0 pointer-events-none">
              {["Alex", "Sam", "Kai"].map((name, i) => (
                <div
                  key={i}
                  className="absolute right-6 flex items-center gap-1 opacity-0 will-change-transform"
                  style={{ top: `${(i + 2) * 28}px` }}
                >
                  <div className="w-0.5 h-5 bg-white animate-pulse-glow" />
                  <span className="text-[10px] px-1.5 py-0.5 bg-white/10 rounded">
                    {name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Copy */}
        <div
          ref={textRef}
          className="text-center max-w-lg opacity-0 will-change-transform"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Work as one.
          </h2>
          <p className="text-base text-muted-foreground leading-relaxed">
            Zero-latency collaborative coding. See every keystroke instantly.
          </p>
        </div>
      </div>
    </section>
  );
};

export default MultiUserSection;