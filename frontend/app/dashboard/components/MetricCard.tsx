import { useEffect, useRef } from "react";
import gsap from "gsap";

interface MetricCardProps {
  title: string;
  value: string;
  change: string;
  changePositive: boolean;
  color: string;
  glowClass: string;
  icon: React.ReactNode;
  delay?: number;
}

const MetricCard = ({ title, value, change, changePositive, color, glowClass, icon, delay = 0 }: MetricCardProps) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const valueRef = useRef<HTMLSpanElement>(null);
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;
    gsap.fromTo(card, { y: 50, opacity: 0, rotateX: 15 }, { y: 0, opacity: 1, rotateX: 0, duration: 0.9, delay, ease: "power3.out" });
  }, [delay]);

  useEffect(() => {
    const el = valueRef.current;
    if (!el) return;
    const numValue = parseFloat(value.replace(/[^0-9.]/g, ""));
    if (isNaN(numValue)) return;
    gsap.fromTo({ val: 0 }, { val: numValue }, {
      val: numValue, duration: 1.8, delay: delay + 0.4, ease: "power2.out",
      onUpdate: function () {
        const current = this.targets()[0].val;
        if (value.includes("$")) el.textContent = "$" + current.toLocaleString("en-US", { maximumFractionDigits: 0 });
        else if (value.includes("%")) el.textContent = current.toFixed(1) + "%";
        else el.textContent = Math.round(current).toLocaleString();
      }
    });
  }, [value, delay]);

  useEffect(() => {
    if (!barRef.current) return;
    gsap.fromTo(barRef.current, { scaleX: 0 }, { scaleX: 1, duration: 1, delay: delay + 0.5, ease: "power2.out", transformOrigin: "left" });
  }, [delay]);

  return (
    <div ref={cardRef} className={`sandbox-card p-5 opacity-0 group cursor-pointer transition-all duration-300 hover:${glowClass}`}>
      <div className="flex items-center justify-between mb-3">
        <div className={`w-8 h-8 rounded-lg bg-secondary flex items-center justify-center ${color} transition-transform duration-300 group-hover:scale-110`}>
          {icon}
        </div>
        <span className={`mono text-xs font-medium ${changePositive ? "neon-text-green" : "neon-text-pink"}`}>
          {change}
        </span>
      </div>
      <p className="text-xs text-muted-foreground mono mb-1">{title}</p>
      <span ref={valueRef} className="text-xl font-bold tracking-tight text-foreground">
        {value}
      </span>
      <div className="mt-3 h-1 rounded-full bg-secondary overflow-hidden">
        <div ref={barRef} className={`h-full rounded-full scale-x-0`} style={{ background: `hsl(var(--${color.includes('cyan') ? 'neon-cyan' : color.includes('green') ? 'neon-green' : color.includes('amber') ? 'neon-amber' : 'neon-pink'}))`, width: changePositive ? '72%' : '45%' }} />
      </div>
    </div>
  );
};

export default MetricCard;
