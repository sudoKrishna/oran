"use client";

import dynamic from "next/dynamic";

const Navbar = dynamic(() => import("@/app/components/Navbar"), { ssr: false });
const HeroSection = dynamic(() => import("@/app/components/HeroSection"), { ssr: false });
const MultiUserSection = dynamic(() => import("@/app/components/MultiUserSection"), { ssr: false });
const AiSection = dynamic(() => import("@/app/components/AiSection"), { ssr: false });
const VoiceSection = dynamic(() => import("@/app/components/VoiceSection"), { ssr: false });
const FooterSection = dynamic(() => import("@/app/components/FooterSection"), { ssr: false });

const LandingPage = () => (
  <div className="bg-background min-h-screen">
    <Navbar />
    <HeroSection />
    <MultiUserSection />
    <AiSection />
    <VoiceSection />
    <FooterSection />
  </div>
);

export default LandingPage;