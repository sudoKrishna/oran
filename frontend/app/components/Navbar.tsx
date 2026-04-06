"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import gsap from "gsap";
import TemplatePicker from "./TemplatePicker";

type Props = { onTemplateSelect: (templateId: string) => void };

const Navbar = ({ onTemplateSelect }: Props) => {
  const navRef = useRef<HTMLElement>(null);
  const router = useRouter();

  const { data: session, status } = useSession(); 
  const [showTemplatePicker, setShowTemplatePicker] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    if (navRef.current) {
      gsap.fromTo(
        navRef.current,
        { y: -20, opacity: 0 },
        { y: 0, opacity: 1, duration: 1, ease: "power4.out", delay: 0.5 }
      );
    }
  }, []);

  const handleLogout = async () => {
    await signOut({ redirect: false });
    router.push("/");
  };

  return (
    <>
      <nav
        ref={navRef}
        className="fixed top-0 left-0 right-0 z-50 nav-blur border-b border-border/50 opacity-0"
      >
        <div className="container mx-auto flex items-center justify-between h-14 px-6">
          <span className="text-sm font-semibold tracking-tight-heading text-foreground">
            ORAN
          </span>

          <div className="flex items-center gap-8">
            <a
              href="#features"
              className="text-xs tracking-loose-body text-muted-foreground hover:text-foreground transition-colors duration-300"
            >
              Features
            </a>

            <a
              href="#ai"
              className="text-xs tracking-loose-body text-muted-foreground hover:text-foreground transition-colors duration-300"
            >
              Intelligence
            </a>

            <a
              href="#voice"
              className="text-xs tracking-loose-body text-muted-foreground hover:text-foreground transition-colors duration-300"
            >
              Voice
            </a>

            {session?.user ? (
              <div className="relative">
                <button
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="w-8 h-8 rounded-full bg-black text-white text-xs flex items-center justify-center"
                >
                  {session.user.email?.charAt(0).toUpperCase()}
                </button>

                {showDropdown && (
                  <div className="absolute right-0 mt-2 w-48 bg-black border rounded-xl shadow-lg p-2">
                    <button
                      onClick={() => router.push("/dashboard")}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-gray-500 rounded-lg"
                    >
                      Dashboard
                    </button>

                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-gray-500 rounded-lg"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <button
                  onClick={() => router.push("/auth/login")}
                  className="text-xs tracking-loose-body text-muted-foreground hover:text-foreground"
                >
                  Login
                </button>

                <button
                  onClick={() => router.push("/auth/signup")}
                  className="text-xs font-medium bg-foreground text-background px-4 py-1.5 rounded-full"
                >
                  Sign up
                </button>
              </>
            )}

            <button
              onClick={() => setShowTemplatePicker(true)}
              className="text-xs font-medium bg-foreground text-background px-4 py-1.5 rounded-full hover:bg-foreground/90 transition-colors duration-300"
            >
              Choose Template
            </button>
          </div>
        </div>
      </nav>

      {/* TemplatePicker modal */}
      {showTemplatePicker && (
        <div className="fixed inset-0 z-50 bg-black/5 flex items-center justify-center">
          <div className="bg-background rounded-xl p-3 max-w-4xl w-full relative">
            <button
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
              onClick={() => setShowTemplatePicker(false)}
            >
              ✕
            </button>

            <TemplatePicker
              onSelect={(templateId) => {
                onTemplateSelect(templateId);
                setShowTemplatePicker(false);
              }}
            />
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;