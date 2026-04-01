import { useEffect, useRef } from "react";
import gsap from "gsap";

const UpgradeBanner = () => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    gsap.fromTo(ref.current, { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, delay: 0.3, ease: "power3.out" });
  }, []);

  return (
    <div ref={ref} className="csb-card p-6 relative opacity-0">
      <button className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
      <h2 className="text-xl font-semibold text-primary mb-1">Get the full CodeSandbox experience</h2>
      <p className="text-sm text-muted-foreground mb-4">Go Pro to unlock better VMs, more runtime hours, more sandboxes and more workspace members.</p>
      <div className="flex items-center gap-3">
        <button className="csb-btn-primary">Upgrade to Pro</button>
        <button className="csb-btn-ghost">Learn more</button>
      </div>
    </div>
  );
};

export default UpgradeBanner;
