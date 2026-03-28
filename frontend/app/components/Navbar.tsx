"use client";
import { useEffect, useRef } from "react";
import gsap from "gsap";

const Navbar = () => {
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    gsap.fromTo(
      navRef.current,
      { y: -20, opacity: 0 },
      { y: 0, opacity: 1, duration: 1, ease: "power4.out", delay: 0.5 }
    );
  }, []);

  return (
    <nav
      ref={navRef}
      className="fixed top-0 left-0 right-0 z-50 nav-blur border-b border-border/50 opacity-0"
    >
      <div className="container mx-auto flex items-center justify-between h-14 px-6">
        <span className="text-sm font-semibold tracking-tight-heading text-foreground">
          ORAN
        </span>
        <div className="flex items-center gap-8">
          <a href="#features" className="text-xs tracking-loose-body text-muted-foreground hover:text-foreground transition-colors duration-300">
            Features
          </a>
          <a href="#ai" className="text-xs tracking-loose-body text-muted-foreground hover:text-foreground transition-colors duration-300">
            Intelligence
          </a>
          <a href="#voice" className="text-xs tracking-loose-body text-muted-foreground hover:text-foreground transition-colors duration-300">
            Voice
          </a>
          <button className="text-xs font-medium bg-foreground text-background px-4 py-1.5 rounded-full hover:bg-foreground/90 transition-colors duration-300">
            Get Early Access
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
