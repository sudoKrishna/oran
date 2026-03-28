"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const BAR_COUNT = 40;

const VoiceSection = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const barsRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const bars = barsRef.current
        ? Array.from(barsRef.current.children)
        : [];

      // 🔥 ONE timeline
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top top",
          end: "bottom bottom",
          scrub: 0.5,
          pin: containerRef.current,
        },
      });

      // Fade in bars (cheap stagger)
      tl.fromTo(
        bars,
        { opacity: 0, scaleY: 0.1 },
        {
          opacity: 1,
          scaleY: 0.3,
          stagger: {
            each: 0.02,
            from: "center",
          },
          duration: 0.6,
        }
      );

      // 🔥 Wave animation (GPU-friendly, no loops)
      gsap.to(bars, {
        scaleY: "random(0.2, 1)",
        duration: 0.6,
        ease: "sine.inOut",
        stagger: {
          each: 0.03,
          repeat: -1,
          yoyo: true,
        },
      });

      // Text reveal
      tl.fromTo(
        textRef.current,
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.8 }
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="relative min-h-[180vh]">
      <div
        ref={containerRef}
        className="h-screen flex flex-col items-center justify-center gap-12 px-6"
      >
        {/* Waveform */}
        <div
          ref={barsRef}
          className="flex items-center gap-[3px] h-24"
        >
          {Array.from({ length: BAR_COUNT }).map((_, i) => (
            <div
              key={i}
              className="w-1.5 h-full rounded-full opacity-0 origin-center will-change-transform"
              style={{
                backgroundColor: `hsl(var(--waveform))`,
                transform: "scaleY(0.2)",
              }}
            />
          ))}
        </div>

        {/* Copy */}
        <div
          ref={textRef}
          className="text-center max-w-lg opacity-0 will-change-transform"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Talk like you're there.
          </h2>
          <p className="text-base text-muted-foreground leading-relaxed">
            Persistent, high-fidelity voice channels. Just open and talk.
          </p>
        </div>
      </div>
    </section>
  );
};

export default VoiceSection;