"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const inputText = "Ask Oran... refactor this function";
const outputLines = [
  "→ Analyzing codebase context...",
  "→ Found 3 optimization opportunities",
  "→ Applying: extract shared logic",
  "→ Applying: reduce complexity O(n²) → O(n)",
  "✓ Refactor complete. 40% fewer lines.",
];

const AiSection = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const terminalRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLDivElement>(null);
  const outputRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // 🔥 One single timeline (BIGGEST performance win)
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top top",
          end: "bottom bottom",
          scrub: 0.5,
          pin: terminalRef.current,
        },
      });

      // Glow (GPU safe)
      tl.fromTo(
        glowRef.current,
        { opacity: 0, scale: 0.9 },
        { opacity: 1, scale: 1, duration: 0.5 }
      );

      // Input typing (clipPath instead of width)
      tl.fromTo(
        inputRef.current,
        { clipPath: "inset(0 100% 0 0)" },
        { clipPath: "inset(0 0% 0 0)", duration: 1 },
        "<"
      );

      // Output (single container + stagger)
      tl.fromTo(
        outputRef.current?.children ?? [],
        { opacity: 0, y: 10 },
        {
          opacity: 1,
          y: 0,
          stagger: 0.15,
          duration: 0.6,
        }
      );

      // Copy
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
        ref={terminalRef}
        className="h-screen flex flex-col items-center justify-center gap-12 px-6"
      >
        {/* Terminal */}
        <div className="relative w-full max-w-2xl">
          {/* Glow */}
          <div
            ref={glowRef}
            className="absolute -inset-8 rounded-3xl opacity-0 will-change-transform"
            style={{
              background:
                "radial-gradient(ellipse at center, hsl(270 80% 60% / 0.12), transparent 70%)",
            }}
          />

          <div className="relative bg-card border border-border rounded-xl overflow-hidden">
            {/* Title bar */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
              <div className="w-3 h-3 rounded-full bg-destructive/60" />
              <div className="w-3 h-3 rounded-full bg-cursor-orange/60" />
              <div className="w-3 h-3 rounded-full bg-cursor-green/60" />
              <span className="ml-3 text-xs text-muted-foreground">oran-ai</span>
            </div>

            <div className="p-6 font-mono text-sm space-y-3">
              {/* Input */}
              <div className="flex items-center gap-2">
                <span className="text-accent">❯</span>

                <div
                  ref={inputRef}
                  className="whitespace-nowrap will-change-transform"
                >
                  {inputText}
                </div>

                <span className="w-2 h-5 bg-foreground/70 animate-pulse-glow" />
              </div>

              {/* Output */}
              <div ref={outputRef} className="space-y-2">
                {outputLines.map((line, i) => (
                  <div
                    key={i}
                    className="opacity-0"
                    style={{
                      color:
                        i === outputLines.length - 1
                          ? "hsl(var(--cursor-green))"
                          : "hsl(var(--muted-foreground))",
                    }}
                  >
                    {line}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Copy */}
        <div
          ref={textRef}
          className="text-center max-w-lg opacity-0 will-change-transform"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Intelligence, embedded.
          </h2>
          <p className="text-base text-muted-foreground leading-relaxed">
            Not just a chatbot. A pair programmer that understands your entire
            codebase.
          </p>
        </div>
      </div>
    </section>
  );
};

export default AiSection;