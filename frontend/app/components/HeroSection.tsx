"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const HeroSection = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const revealRef = useRef<HTMLDivElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // 🔥 GPU-friendly reveal (scale instead of SVG math)
      gsap.fromTo(
        revealRef.current,
        { scaleX: 0, transformOrigin: "left center" },
        {
          scaleX: 1,
          ease: "none",
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top top",
            end: "bottom center",
            scrub: 0.5,
          },
        }
      );

      // subtitle (cheap animation)
      gsap.fromTo(
        subtitleRef.current,
        { opacity: 0, y: 20 },
        {
          opacity: 1,
          y: 0,
          ease: "power2.out",
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "30% center",
            end: "60% center",
            scrub: 0.5,
          },
        }
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative min-h-[200vh] flex flex-col items-center pt-[30vh]"
    >
      <div className="sticky top-[20vh] flex flex-col items-center">

        {/* MASK WRAPPER */}
        <div className="relative overflow-hidden">

          {/* Reveal layer */}
          <div
            ref={revealRef}
            className="absolute inset-0 bg-white origin-left will-change-transform"
          />

          {/* SVG (static = fast) */}
          <svg
            viewBox="0 0 800 200"
            className="w-[90vw] max-w-[900px] h-auto mix-blend-difference"
            fill="none"
          >
            <path d="M30 100 C30 45 75 10 120 10 C165 10 210 45 210 100 C210 155 165 190 120 190 C75 190 30 155 30 100 Z" stroke="white" strokeWidth="3" />
            <path d="M250 190 L250 10 L330 10 C370 10 390 35 390 60 C390 85 370 105 330 105 L250 105 M330 105 L400 190" stroke="white" strokeWidth="3" />
            <path d="M430 190 L510 10 L590 190 M460 130 L560 130" stroke="white" strokeWidth="3" />
            <path d="M630 190 L630 10 L770 190 L770 10" stroke="white" strokeWidth="3" />
          </svg>
        </div>

        <p
          ref={subtitleRef}
          className="mt-10 text-center text-lg max-w-lg opacity-0 will-change-transform"
        >
          The collaborative engine for the next generation of engineers.
        </p>
      </div>
    </section>
  );
};

export default HeroSection;