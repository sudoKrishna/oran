"use client";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import gsap from "gsap";
import { Eye, EyeOff, ArrowRight } from "lucide-react";
import Link from "next/link";

const SVGTextAnimation = () => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current) return;
    const paths = svgRef.current.querySelectorAll(".letter-path");
    const subtitle = svgRef.current.querySelector(".subtitle-text");
    const dots = svgRef.current.querySelectorAll(".dot");

    gsap.set(paths, {
      strokeDasharray: function (this: SVGPathElement) {
        return this.getTotalLength?.() || 200;
      },
      strokeDashoffset: function (this: SVGPathElement) {
        return this.getTotalLength?.() || 200;
      },
      fill: "transparent",
    });
    gsap.set(subtitle, { opacity: 0, y: 8 });
    gsap.set(dots, { scale: 0, transformOrigin: "center center" });

    const tl = gsap.timeline({ delay: 0.3 });
    tl.to(paths, {
      strokeDashoffset: 0,
      duration: 1.4,
      ease: "power3.inOut",
      stagger: 0.08,
    })
      .to(
        paths,
        { fill: "hsl(0, 0%, 7%)", duration: 0.6, ease: "power2.out", stagger: 0.04 },
        "-=0.5"
      )
      .to(dots, { scale: 1, duration: 0.4, ease: "back.out(3)", stagger: 0.1 }, "-=0.3")
      .to(subtitle, { opacity: 1, y: 0, duration: 0.6, ease: "power2.out" }, "-=0.2");
  }, []);

  return (
    <svg
      ref={svgRef}
      viewBox="0 0 400 120"
      className="w-full max-w-[300px]"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* S */}
      <path
        className="letter-path"
        d="M30 65 C30 45, 60 40, 60 55 C60 70, 25 68, 25 85 C25 100, 60 102, 60 85"
        stroke="hsl(0,0%,7%)" strokeWidth="3" fill="transparent" strokeLinecap="round"
      />
      {/* i */}
      <line className="letter-path" x1="80" y1="55" x2="80" y2="100"
        stroke="hsl(0,0%,7%)" strokeWidth="3" strokeLinecap="round" />
      <circle className="dot" cx="80" cy="42" r="3" fill="hsl(211,100%,50%)" />
      {/* g */}
      <path
        className="letter-path"
        d="M115 70 C100 55, 95 90, 110 95 C125 100, 120 55, 115 70 M120 95 C120 115, 95 115, 95 105"
        stroke="hsl(0,0%,7%)" strokeWidth="3" fill="transparent" strokeLinecap="round"
      />
      {/* n */}
      <path
        className="letter-path"
        d="M140 100 L140 55 C140 55, 170 45, 170 70 L170 100"
        stroke="hsl(0,0%,7%)" strokeWidth="3" fill="transparent" strokeLinecap="round"
      />
      
      <line className="letter-path" x1="210" y1="35" x2="210" y2="100"
        stroke="hsl(0,0%,7%)" strokeWidth="3.5" strokeLinecap="round" />
      {/* n */}
      <path
        className="letter-path"
        d="M235 100 L235 55 C235 55, 265 45, 265 70 L265 100"
        stroke="hsl(0,0%,7%)" strokeWidth="3" fill="transparent" strokeLinecap="round"
      />
    
      <circle className="dot" cx="285" cy="98" r="3.5" fill="hsl(211,100%,50%)" />
      
      <text
        className="subtitle-text"
        x="200" y="118"
        textAnchor="middle"
        fontSize="10"
        fill="hsl(0,0%,45%)"
        fontFamily="-apple-system, sans-serif"
        fontWeight="400"
        letterSpacing="3"
      >
        YOUR ACCOUNT AWAITS
      </text>
    </svg>
  );
};

export default function SignupPage() {
  const router = useRouter();
  const formRef = useRef<HTMLDivElement>(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  
  useEffect(() => {
    if (!formRef.current) return;
    const items = formRef.current.querySelectorAll(".form-item");
    gsap.fromTo(
      items,
      { opacity: 0, y: 18 },
      { opacity: 1, y: 0, duration: 0.55, ease: "power3.out", stagger: 0.07, delay: 0.9 }
    );
  }, []);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name }),
      });
      const data = await res.json();

      if (res.ok) {
        router.push("/auth/login");
      } else {
        setError(data.error || "Signup failed");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[hsl(40,20%,97%)] flex items-center justify-center p-4">
    
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(hsl(0,0%,88%) 1px, transparent 1px), linear-gradient(90deg, hsl(0,0%,88%) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
          opacity: 0.45,
        }}
      />

      <div className="relative w-full max-w-[420px]">
        
        <div className="bg-white rounded-2xl border border-[hsl(0,0%,90%)] shadow-[0_8px_40px_-12px_rgba(0,0,0,0.12)] px-8 pt-10 pb-8">

         
          <div className="flex justify-center mb-8">
            <SVGTextAnimation />
          </div>

          
          <div ref={formRef}>
            <form onSubmit={handleSignup} className="flex flex-col gap-4">

             
              <div className="form-item opacity-0">
                <label className="block text-[11px] font-semibold uppercase tracking-widest text-[hsl(0,0%,45%)] mb-1.5">
                  Full Name
                </label>
                <input
                  type="text"
                  placeholder="Jane Smith"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full h-12 px-4 rounded-xl border border-[hsl(0,0%,88%)] bg-[hsl(40,20%,98%)] text-sm text-[hsl(0,0%,10%)] placeholder:text-[hsl(0,0%,70%)] outline-none transition-all focus:border-[hsl(211,100%,50%)] focus:ring-2 focus:ring-[hsl(211,100%,50%,0.12)]"
                />
              </div>

              
              <div className="form-item opacity-0">
                <label className="block text-[11px] font-semibold uppercase tracking-widest text-[hsl(0,0%,45%)] mb-1.5">
                  Email
                </label>
                <input
                  type="email"
                  placeholder="jane@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full h-12 px-4 rounded-xl border border-[hsl(0,0%,88%)] bg-[hsl(40,20%,98%)] text-sm text-[hsl(0,0%,10%)] placeholder:text-[hsl(0,0%,70%)] outline-none transition-all focus:border-[hsl(211,100%,50%)] focus:ring-2 focus:ring-[hsl(211,100%,50%,0.12)]"
                />
              </div>

             
              <div className="form-item opacity-0">
                <label className="block text-[11px] font-semibold uppercase tracking-widest text-[hsl(0,0%,45%)] mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Min. 8 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full h-12 px-4 pr-12 rounded-xl border border-[hsl(0,0%,88%)] bg-[hsl(40,20%,98%)] text-sm text-[hsl(0,0%,10%)] placeholder:text-[hsl(0,0%,70%)] outline-none transition-all focus:border-[hsl(211,100%,50%)] focus:ring-2 focus:ring-[hsl(211,100%,50%,0.12)]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[hsl(0,0%,60%)] hover:text-[hsl(0,0%,20%)] transition-colors"
                  >
                    {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </div>

             
              {error && (
                <p className="form-item text-xs text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                  {error}
                </p>
              )}

         
              <div className="form-item opacity-0 mt-1">
                <button
                  type="submit"
                  disabled={loading}
                  className="group w-full h-12 rounded-xl bg-[hsl(0,0%,7%)] hover:bg-[hsl(0,0%,14%)] text-white text-sm font-semibold flex items-center justify-center gap-2 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      Create Account
                      <ArrowRight
                        size={15}
                        className="transition-transform group-hover:translate-x-0.5"
                      />
                    </>
                  )}
                </button>
              </div>

              
              <div className="form-item opacity-0 flex items-center gap-3 my-0.5">
                <div className="flex-1 h-px bg-[hsl(0,0%,91%)]" />
                <span className="text-[11px] text-[hsl(0,0%,60%)]">or</span>
                <div className="flex-1 h-px bg-[hsl(0,0%,91%)]" />
              </div>

              <div className="form-item opacity-0 flex gap-3">
                <button
                  type="button"
                  className="flex-1 h-11 rounded-xl border border-[hsl(0,0%,88%)] bg-white hover:bg-[hsl(0,0%,97%)] text-sm font-medium flex items-center justify-center gap-2 transition-colors text-[hsl(0,0%,20%)]"
                >
                  <svg viewBox="0 0 24 24" className="w-4 h-4">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                  </svg>
                  Google
                </button>
                <button
                  type="button"
                  className="flex-1 h-11 rounded-xl border border-[hsl(0,0%,88%)] bg-white hover:bg-[hsl(0,0%,97%)] text-sm font-medium flex items-center justify-center gap-2 transition-colors text-[hsl(0,0%,20%)]"
                >
                  <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
                  </svg>
                  Apple
                </button>
              </div>

         
              <p className="form-item opacity-0 text-center text-sm text-[hsl(0,0%,50%)] mt-1">
                Already have an account?{" "}
                <Link
                  href="/auth/login"
                  className="font-semibold text-[hsl(211,100%,50%)] hover:underline"
                >
                  Sign in
                </Link>
              </p>
            </form>
          </div>
        </div>

      
        <p className="text-center text-[11px] text-[hsl(0,0%,62%)] mt-5 tracking-wide">
          By signing up you agree to our{" "}
          <span className="underline cursor-pointer hover:text-[hsl(0,0%,40%)] transition-colors">
            Terms
          </span>{" "}
          &{" "}
          <span className="underline cursor-pointer hover:text-[hsl(0,0%,40%)] transition-colors">
            Privacy Policy
          </span>
        </p>
      </div>
    </div>
  );
}