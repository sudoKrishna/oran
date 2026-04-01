// import { getServerSession } from "next-auth";
// import { authOptions } from "@/lib/auth";

// export default async function Dashboard() {
//   const session = await getServerSession(authOptions);

//   if (!session) {
//     return <div>Unauthorized</div>;
//   }

//   return <div>Welcome {session.user?.email}</div>;
// }

"use client";
import { useEffect, useRef } from "react";
import gsap from "gsap";
import Sidebar from "./components/Sidebar";
import TopBar from "./components/TopBar";
import UpgradeBanner from "./components/UpgradeBanner";
import ProjectCard from "./components/ProjectCard";
import { useSession } from "next-auth/react";

const projects = [
  { name: "sharp-silence", createdBy: "Created by you", time: "15h ago", type: "Sandbox" },
  { name: "cool-breeze", createdBy: "Created by you", time: "2d ago", type: "Devbox" },
  { name: "bright-dawn", createdBy: "Created by you", time: "5d ago", type: "Sandbox" },
];

const Index = () => {
  const { data: session } = useSession();
  const titleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!titleRef.current) return;
    gsap.fromTo(titleRef.current, { y: 15, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, delay: 0.5, ease: "power3.out" });
  }, []);

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar session={session} />
        <main className="flex-1 overflow-y-auto p-6">
          <UpgradeBanner />

          <div ref={titleRef} className="mt-8 opacity-0">
            <h1 className="text-2xl font-semibold text-foreground">Recent</h1>
            <p className="text-sm text-muted-foreground mt-1">Pick up where you left off</p>
          </div>

          <div className="flex flex-wrap gap-4 mt-5">
            {projects.map((p, i) => (
              <ProjectCard key={p.name} {...p} delay={0.6 + i * 0.1} />
            ))}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Index;
