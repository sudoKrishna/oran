// ─── GSAP Animation Helpers ───────────────────────────────────────────────────
// All animations are client-side only (GSAP not SSR-safe).

import gsap from "gsap";

/**
 * Ghost Text Streaming Effect — staggered opacity shimmer
 * Gives AI-generated lines a "premium typewriter with intention" feel.
 */
export function animateGhostText(selector: string) {
  gsap.fromTo(
    selector,
    { opacity: 0, x: -8, filter: "blur(4px)" },
    {
      opacity: 1,
      x: 0,
      filter: "blur(0px)",
      stagger: 0.05,
      duration: 0.4,
      ease: "power2.out",
    }
  );
}

/**
 * Context Ripple — subtle glow pulse across lines when AI indexes code.
 */
export function triggerContextRipple(containerEl: HTMLElement) {
  const tl = gsap.timeline();
  tl.fromTo(
    containerEl,
    { boxShadow: "inset 0 0 0px 0px rgba(139,92,246,0)" },
    {
      boxShadow: "inset 0 0 40px 2px rgba(139,92,246,0.18)",
      duration: 0.6,
      ease: "power2.inOut",
    }
  ).to(containerEl, {
    boxShadow: "inset 0 0 0px 0px rgba(139,92,246,0)",
    duration: 0.6,
    ease: "power2.out",
  });
}

/**
 * AI Panel open — FLIP-inspired width + blur entrance.
 */
export function openAiPanel(el: HTMLElement) {
  gsap.fromTo(
    el,
    { width: 0, opacity: 0, filter: "blur(8px)" },
    {
      width: 340,
      opacity: 1,
      filter: "blur(0px)",
      duration: 0.38,
      ease: "back.out(1.4)",
    }
  );
}

/**
 * AI Panel close — collapse + blur fade.
 */
export function closeAiPanel(el: HTMLElement, onComplete: () => void) {
  gsap.to(el, {
    width: 0,
    opacity: 0,
    filter: "blur(6px)",
    duration: 0.25,
    ease: "power3.in",
    onComplete,
  });
}

/**
 * Orb pulse on AI loading — "alive" breathing animation.
 */
export function pulseOrb(orbEl: HTMLElement, color: string) {
  gsap.to(orbEl, {
    boxShadow: `0 0 20px 6px ${color}`,
    scale: 1.4,
    duration: 0.4,
    ease: "elastic.out(1, 0.4)",
    yoyo: true,
    repeat: -1,
  });
}

/**
 * Stop orb animation and reset.
 */
export function stopOrb(orbEl: HTMLElement) {
  gsap.killTweensOf(orbEl);
  gsap.to(orbEl, { boxShadow: "none", scale: 1, duration: 0.3, ease: "power2.out" });
}