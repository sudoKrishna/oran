"use client";

import { useEffect, useRef, useState, useCallback , useMemo } from "react";
import { gsap } from "gsap";
import { useWebRTC } from "@/app/hooks/useWebRTC";


type PresenceUser = {
  userId: string;
  name: string | null;
  email: string | null;
  color: string;
  isSpeaking?: boolean;
  volume?: number;
  micOn?: boolean;
};

type Props = {
  activeUsers: PresenceUser[];
  currentUserId?: string;
};


function getInitials(name: string | null, email: string | null): string {
  const src = name || email || "?";
  return src.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
}

function positionOnArc(index: number, total: number, radius: number): { x: number; y: number } {
  const startAngle = 270;
  const endAngle = 360;
  const range = endAngle - startAngle;
  const step = total === 1 ? range / 2 : range / (total - 1);
  const angle = startAngle + index * step;
  const rad = (angle * Math.PI) / 180;
  return {
    x: Math.cos(rad) * radius,
    y: Math.sin(rad) * radius,
  };
}

//  VoiceRing 
function VoiceRing({ color, volume }: { color: string; volume: number }) {
  const ring1 = useRef<HTMLDivElement>(null);
  const ring2 = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ring1.current || !ring2.current) return;
    const scale = 1 + volume * 0.6;
    const scale2 = 1 + volume * 1.1;
    const opacity = volume * 0.7;
    gsap.to(ring1.current, { scale, opacity, duration: 0.12, ease: "power2.out" });
    gsap.to(ring2.current, { scale: scale2, opacity: opacity * 0.4, duration: 0.2, ease: "power2.out" });
  }, [volume]);

  return (
    <>
      <div ref={ring1} className="absolute inset-0 rounded-full pointer-events-none" style={{ border: `2px solid ${color}`, opacity: 0, transform: "scale(1)" }} />
      <div ref={ring2} className="absolute inset-0 rounded-full pointer-events-none" style={{ border: `1.5px solid ${color}`, opacity: 0, transform: "scale(1)" }} />
    </>
  );
}

// MicIndicator 
function MicIndicator({ micOn, color, size = 16 }: { micOn: boolean; color: string; size?: number }) {
  return (
    <div
      style={{
        position: "absolute",
        bottom: -2,
        right: -2,
        width: size,
        height: size,
        borderRadius: "50%",
        background: micOn ? "rgba(34,197,94,0.9)" : "rgba(120,120,120,0.8)",
        border: "2px solid rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 3,
      }}
    >
      <svg width={size * 0.55} height={size * 0.55} viewBox="0 0 24 24" fill="none">
        {micOn ? (
          <>
            <rect x="9" y="2" width="6" height="12" rx="3" fill="white" />
            <path d="M5 10a7 7 0 0014 0" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
          </>
        ) : (
          <>
            <rect x="9" y="2" width="6" height="12" rx="3" fill="rgba(255,255,255,0.5)" />
            <line x1="4" y1="4" x2="20" y2="20" stroke="rgba(255,80,80,0.9)" strokeWidth="3" strokeLinecap="round" />
          </>
        )}
      </svg>
    </div>
  );
}

// UserOrb 
function UserOrb({ user, size = 44, style }: { user: PresenceUser; size?: number; style?: React.CSSProperties }) {
  const orbRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!orbRef.current) return;
    if (user.isSpeaking) {
      gsap.to(orbRef.current, { boxShadow: `0 0 0 3px ${user.color}55, 0 0 16px ${user.color}88`, duration: 0.2 });
    } else {
      gsap.to(orbRef.current, { boxShadow: `0 0 0 1.5px ${user.color}33`, duration: 0.3 });
    }
  }, [user.isSpeaking, user.color]);

  return (
    <div
      ref={orbRef}
      className="group relative flex items-center justify-center rounded-full select-none cursor-default"
      style={{
        width: size,
        height: size,
        background: `radial-gradient(135deg at 30% 30%, ${user.color}dd, ${user.color}66)`,
        boxShadow: `0 0 0 1.5px ${user.color}33`,
        backdropFilter: "blur(12px)",
        fontFamily: "'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif",
        fontSize: size * 0.32,
        fontWeight: 600,
        color: "rgba(255,255,255,0.95)",
        letterSpacing: "0.03em",
        ...style,
      }}
    >
      <VoiceRing color={user.color} volume={user.volume ?? 0} />
      {getInitials(user.name, user.email)}
      <MicIndicator micOn={user.micOn ?? false} color={user.color} size={16} />
      {/* Tooltip */}
      <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" style={{ whiteSpace: "nowrap" }}>
        <div style={{ background: "rgba(20,20,24,0.92)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, padding: "5px 10px", fontSize: 11, color: "rgba(255,255,255,0.85)", backdropFilter: "blur(16px)" }}>
          <p style={{ fontWeight: 500 }}>{user.name || "Anonymous"}</p>
          {user.email && <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 10 }}>{user.email}</p>}
          <p style={{ color: user.micOn ? "rgba(34,197,94,0.9)" : "rgba(255,80,80,0.7)", fontSize: 9, marginTop: 2 }}>
            {user.micOn ? "🎤 Mic on" : "🔇 Mic off"}
          </p>
        </div>
      </div>
    </div>
  );
}

//  ScrollIndicator 
function ScrollIndicator({ canScrollUp, canScrollDown }: { canScrollUp: boolean; canScrollDown: boolean }) {
  if (!canScrollUp && !canScrollDown) return null;
  return (
    <div
      style={{
        position: "absolute",
        bottom: -36,
        left: "50%",
        transform: "translateX(-50%)",
        display: "flex",
        alignItems: "center",
        gap: 4,
        pointerEvents: "none",
      }}
    >
      <div style={{
        fontSize: 9,
        color: "rgba(255,255,255,0.3)",
        fontFamily: "'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif",
        letterSpacing: "0.05em",
        display: "flex",
        alignItems: "center",
        gap: 3,
        whiteSpace: "nowrap",
      }}>
        {canScrollUp && <span style={{ opacity: 0.5 }}>↑</span>}
        <span>scroll</span>
        {canScrollDown && <span style={{ opacity: 0.5 }}>↓</span>}
      </div>
    </div>
  );
}

// PresenceHub 
export default function PresenceHub({ activeUsers, currentUserId }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [micOn, setMicOn] = useState(false);
  const [myVolume, setMyVolume] = useState(0);

  const peerIds = useMemo(
    () => activeUsers.map((u) => u.userId),
    [activeUsers]
  );


const safeUserId = currentUserId ?? null;

useWebRTC(safeUserId as string, peerIds);
  const hubRef = useRef<HTMLButtonElement>(null);
  const orbsContainerRef = useRef<HTMLDivElement>(null);
  const sectorRef = useRef<SVGSVGElement>(null);
  const orbRefs = useRef<(HTMLDivElement | null)[]>([]);
  const micStreamRef = useRef<MediaStream | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number>(0);
  const tlRef = useRef<gsap.core.Timeline | null>(null);
  const scrollAccumRef = useRef<number>(0);

  const RADIUS = 110;
  const HUB_SIZE = 52;
  const MAX_VISIBLE = 8;
  const SCROLL_THRESHOLD = 60;




  // Open/close animation 
  const openHub = useCallback(() => {
    setIsOpen(true);
    if (tlRef.current) tlRef.current.kill();
    const tl = gsap.timeline();
    tlRef.current = tl;

    if (sectorRef.current) {
      tl.fromTo(sectorRef.current, { opacity: 0, scale: 0.4, transformOrigin: "0% 100%" }, { opacity: 1, scale: 1, duration: 0.45, ease: "back.out(1.4)" }, 0);
    }

    const visibleCount = Math.min(activeUsers.length, MAX_VISIBLE);
    orbRefs.current.forEach((el, i) => {
      if (!el || i >= visibleCount) return;
      const { x, y } = positionOnArc(i, visibleCount, RADIUS);
      tl.fromTo(el, { x: 0, y: 0, scale: 0, opacity: 0 }, { x, y, scale: 1, opacity: 1, duration: 0.38, ease: "back.out(1.6)", delay: i * 0.055 }, 0.08);
    });
  }, [activeUsers.length]);

  // Re-positions orbs smoothly when the visible slice changes (scroll)
  const repositionOrbs = useCallback((visibleCount: number) => {
    orbRefs.current.forEach((el, i) => {
      if (!el || i >= visibleCount) return;
      const { x, y } = positionOnArc(i, visibleCount, RADIUS);
      gsap.to(el, { x, y, scale: 1, opacity: 1, duration: 0.3, ease: "power2.out" });
    });
  }, []);

  const closeHub = useCallback(() => {
    if (tlRef.current) tlRef.current.kill();
    const tl = gsap.timeline({ onComplete: () => setIsOpen(false) });
    tlRef.current = tl;
    orbRefs.current.forEach((el, i) => {
      if (!el) return;
      tl.to(el, { x: 0, y: 0, scale: 0, opacity: 0, duration: 0.25, ease: "back.in(1.4)" }, i * 0.04);
    });
    if (sectorRef.current) {
      tl.to(sectorRef.current, { opacity: 0, scale: 0.4, transformOrigin: "0% 100%", duration: 0.3, ease: "power2.in" }, 0.1);
    }
  }, []);

  const toggle = () => (isOpen ? closeHub() : openHub());

  useEffect(() => {
    if (isOpen) openHub();
  }, [activeUsers, isOpen, openHub]);

  //  Hub button pulse 
  useEffect(() => {
    if (!hubRef.current) return;
    const pulse = gsap.to(hubRef.current, {
      boxShadow: "0 0 0 8px rgba(255,255,255,0.04), 0 0 24px rgba(255,255,255,0.06)",
      scale: 1.03, repeat: -1, yoyo: true, duration: 2.2, ease: "sine.inOut",
    });
    return () => { pulse.kill(); };
  }, []);

  // Mic 
  const startMic = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      micStreamRef.current = stream;
      const ctx = new AudioContext();
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 512;
      source.connect(analyser);
      analyserRef.current = analyser;
      const data = new Uint8Array(analyser.frequencyBinCount);
      const tick = () => {
        analyser.getByteFrequencyData(data);
        const avg = data.reduce((a, b) => a + b, 0) / data.length;
        setMyVolume(Math.min(avg / 80, 1));
        animFrameRef.current = requestAnimationFrame(tick);
      };
      animFrameRef.current = requestAnimationFrame(tick);
      setMicOn(true);
    } catch (e) {
      console.error("Mic error:", e);
    }
  };

  const stopMic = () => {
    micStreamRef.current?.getTracks().forEach((t) => t.stop());
    micStreamRef.current = null;
    analyserRef.current = null;
    cancelAnimationFrame(animFrameRef.current);
    setMyVolume(0);
    setMicOn(false);
  };

  const toggleMic = () => (micOn ? stopMic() : startMic());
  useEffect(() => () => stopMic(), []);

  //  Enrich users 
  const enrichedUsers = activeUsers.map((u) =>
    u.userId === currentUserId
      ? { ...u, volume: myVolume, isSpeaking: myVolume > 0.15, micOn }
      : u
  );

  // Scroll offset 
  const [scrollOffset, setScrollOffset] = useState(0);
  const totalUsers = enrichedUsers.length;
  const canScroll = totalUsers > MAX_VISIBLE;

  useEffect(() => {
    if (!isOpen || !canScroll) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      scrollAccumRef.current += e.deltaY;

      if (scrollAccumRef.current >= SCROLL_THRESHOLD) {
        scrollAccumRef.current = 0;
        setScrollOffset((prev) => Math.min(totalUsers - MAX_VISIBLE, prev + 1));
      } else if (scrollAccumRef.current <= -SCROLL_THRESHOLD) {
        scrollAccumRef.current = 0;
        setScrollOffset((prev) => Math.max(0, prev - 1));
      }
    };


    const el = orbsContainerRef.current ?? document;
    el.addEventListener("wheel", handleWheel as EventListener, { passive: false });
    return () => el.removeEventListener("wheel", handleWheel as EventListener);
  }, [isOpen, canScroll, totalUsers]);

  useEffect(() => {
    if (!isOpen) return;
    const visibleCount = Math.min(totalUsers, MAX_VISIBLE);
    // rAF ensures GSAP runs after React commits the new orbRefs
    const id = requestAnimationFrame(() => repositionOrbs(visibleCount));
    return () => cancelAnimationFrame(id);
  }, [scrollOffset, isOpen, totalUsers, repositionOrbs]);


  useEffect(() => {
    if (!isOpen) {
      scrollAccumRef.current = 0;
      setScrollOffset(0);
    }
  }, [isOpen]);

  const visibleUsers = canScroll
    ? enrichedUsers.slice(scrollOffset, scrollOffset + MAX_VISIBLE)
    : enrichedUsers;

  const canScrollUp = scrollOffset > 0;
  const canScrollDown = scrollOffset + MAX_VISIBLE < totalUsers;

  //  SVG sector 
  const SVG_SIZE = RADIUS + 70;
  const arcR = RADIUS + 28;

  const toSVG = (angleDeg: number, r: number) => {
    const rad = (angleDeg * Math.PI) / 180;
    return { x: Math.cos(rad) * r, y: SVG_SIZE + Math.sin(rad) * r };
  };

  const p270 = toSVG(270, arcR);
  const p360 = toSVG(360, arcR);

  const sectorPath = `
    M 0 ${SVG_SIZE}
    L ${p270.x} ${p270.y}
    A ${arcR} ${arcR} 0 0 1 ${p360.x} ${p360.y}
    Z
  `;

  return (
    <div
      style={{
        position: "fixed",
        bottom: 28,
        left: 28,
        zIndex: 9999,
        fontFamily: "'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif",
      }}
    >
      {/*  Sector background  */}
      <svg
        ref={sectorRef}
        width={SVG_SIZE + 10}
        height={SVG_SIZE + 10}
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          pointerEvents: "none",
          opacity: 0,
          overflow: "visible",
        }}
        viewBox={`-5 0 ${SVG_SIZE + 10} ${SVG_SIZE + 10}`}
      >
        <defs>
          <radialGradient id="sectorGrad" cx="0%" cy="100%" r="100%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.07)" />
            <stop offset="60%" stopColor="rgba(255,255,255,0.03)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0)" />
          </radialGradient>
          <filter id="sectorBlur"><feGaussianBlur stdDeviation="0.8" /></filter>
        </defs>
        <path d={sectorPath} fill="url(#sectorGrad)" stroke="rgba(255,255,255,0.07)" strokeWidth="1" filter="url(#sectorBlur)" />
        <path d={`M ${p270.x} ${p270.y} A ${arcR} ${arcR} 0 0 1 ${p360.x} ${p360.y}`} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="1" strokeDasharray="3 6" />
      </svg>

      {/* User orbs  */}
      {isOpen && (
        <div
          ref={orbsContainerRef}
          style={{ position: "absolute", bottom: HUB_SIZE / 2, left: HUB_SIZE / 2 }}
        >
          {visibleUsers.map((user, i) => (
            <div
              key={`slot-${scrollOffset + i}`}
              ref={(el) => { orbRefs.current[i] = el; }}
              className="group"
              style={{ position: "absolute", transform: "translate(-50%, -50%)", opacity: 0 }}
            >
              <UserOrb user={user} size={44} />
              {user.isSpeaking && (
                <div style={{
                  position: "absolute", top: "100%", left: "50%", transform: "translateX(-50%)",
                  marginTop: 4, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)",
                  border: "1px solid rgba(255,255,255,0.1)", borderRadius: 6,
                  padding: "2px 6px", fontSize: 9, color: user.color, whiteSpace: "nowrap", fontWeight: 500,
                }}>
                  speaking
                </div>
              )}
            </div>
          ))}


          {canScroll && (
            <ScrollIndicator canScrollUp={canScrollUp} canScrollDown={canScrollDown} />
          )}
        </div>
      )}

      {/*  Count badge  */}
      {activeUsers.length > 0 && !isOpen && (
        <div style={{
          position: "absolute", top: -4, right: -4,
          width: 18, height: 18, borderRadius: "50%",
          background: "rgba(255,255,255,0.9)", color: "#000",
          fontSize: 10, fontWeight: 700,
          display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 2, border: "1.5px solid rgba(0,0,0,0.15)",
        }}>
          {activeUsers.length}
        </div>
      )}

      {/* Mic button  */}
      <button
        onClick={toggleMic}
        style={{
          position: "absolute",
          bottom: HUB_SIZE + 10,
          left: "50%",
          transform: "translateX(-50%)",
          width: 32, height: 32, borderRadius: "50%",
          border: micOn ? "1.5px solid rgba(255,80,80,0.6)" : "1.5px solid rgba(255,255,255,0.12)",
          background: micOn ? "rgba(255,50,50,0.18)" : "rgba(255,255,255,0.06)",
          backdropFilter: "blur(16px)",
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: "pointer", transition: "all 0.2s ease", zIndex: 2,
        }}
        title={micOn ? "Mute mic" : "Unmute mic"}
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
          {micOn ? (
            <>
              <rect x="9" y="2" width="6" height="12" rx="3" fill="rgba(255,80,80,0.9)" />
              <path d="M5 10a7 7 0 0014 0" stroke="rgba(255,80,80,0.9)" strokeWidth="2" strokeLinecap="round" />
              <line x1="12" y1="17" x2="12" y2="21" stroke="rgba(255,80,80,0.9)" strokeWidth="2" strokeLinecap="round" />
              <rect x="9" y="2" width="6" height={12 * myVolume} rx="3" fill="rgba(255,120,120,0.6)" style={{ transition: "height 0.05s" }} />
            </>
          ) : (
            <>
              <rect x="9" y="2" width="6" height="12" rx="3" fill="rgba(255,255,255,0.4)" />
              <path d="M5 10a7 7 0 0014 0" stroke="rgba(255,255,255,0.4)" strokeWidth="2" strokeLinecap="round" />
              <line x1="12" y1="17" x2="12" y2="21" stroke="rgba(255,255,255,0.4)" strokeWidth="2" strokeLinecap="round" />
              <line x1="4" y1="4" x2="20" y2="20" stroke="rgba(255,80,80,0.7)" strokeWidth="2" strokeLinecap="round" />
            </>
          )}
        </svg>
        {micOn && myVolume > 0.1 && (
          <div style={{
            position: "absolute", inset: -3, borderRadius: "50%",
            border: "1.5px solid rgba(255,80,80,0.5)",
            transform: `scale(${1 + myVolume * 0.4})`,
            opacity: myVolume * 0.8,
            transition: "transform 0.08s, opacity 0.08s", pointerEvents: "none",
          }} />
        )}
      </button>

      {/* Main hub button  */}
      <button
        ref={hubRef}
        onClick={toggle}
        style={{
          width: HUB_SIZE, height: HUB_SIZE, borderRadius: "50%",
          border: isOpen ? "1.5px solid rgba(255,255,255,0.2)" : "1.5px solid rgba(255,255,255,0.1)",
          background: isOpen ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.07)",
          backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)",
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: "pointer", position: "relative", zIndex: 2,
          transition: "background 0.3s ease, border 0.3s ease",
          boxShadow: "0 0 0 1px rgba(255,255,255,0.04), 0 8px 32px rgba(0,0,0,0.3)",
        }}
        title={isOpen ? "Close presence" : "See who's here"}
      >
        {!isOpen ? (
          <div style={{ display: "flex", alignItems: "center" }}>
            {enrichedUsers.slice(0, 3).map((u, i) => (
              <div
                key={u.userId}
                style={{
                  width: 20, height: 20, borderRadius: "50%",
                  background: `radial-gradient(circle at 35% 35%, ${u.color}ee, ${u.color}88)`,
                  border: "1.5px solid rgba(0,0,0,0.3)",
                  marginLeft: i > 0 ? -7 : 0,
                  fontSize: 7, fontWeight: 700, color: "rgba(255,255,255,0.9)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  zIndex: 3 - i, position: "relative",
                }}
              >
                {getInitials(u.name, u.email)}
              </div>
            ))}
            {enrichedUsers.length === 0 && (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="8" r="4" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" />
                <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            )}
          </div>
        ) : (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <line x1="18" y1="6" x2="6" y2="18" stroke="rgba(255,255,255,0.7)" strokeWidth="2" strokeLinecap="round" />
            <line x1="6" y1="6" x2="18" y2="18" stroke="rgba(255,255,255,0.7)" strokeWidth="2" strokeLinecap="round" />
          </svg>
        )}
      </button>

      {isOpen && activeUsers.length === 1 && (
        <div style={{
          position: "absolute", bottom: HUB_SIZE + 56, left: "50%", transform: "translateX(-50%)",
          whiteSpace: "nowrap", fontSize: 10, color: "rgba(255,255,255,0.3)",
          fontWeight: 500, letterSpacing: "0.05em", pointerEvents: "none",
        }}>
          Only you
        </div>
      )}
    </div>
  );
}