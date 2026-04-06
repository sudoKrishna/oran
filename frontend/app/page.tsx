"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

import TemplatePicker from "@/app/components/TemplatePicker";
import LandingPage from "@/app/components/LandingPage";

const FloatingTerminal = dynamic(
  () => import("@/app/components/FloatingTerminal"),
  { ssr: false }
);

const CodeEditor = dynamic(
  () => import("@/app/editor/components/VSCodeUI"),
  { ssr: false }
);

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [projectId, setProjectId] = useState<string | null>(null);
  const [filesReady, setFilesReady] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const idFromUrl = urlParams.get("projectId");

    if (idFromUrl) {
      setProjectId(idFromUrl);
      setFilesReady(true);
    }

    setIsLoading(false);
  }, []);

  const waitForFiles = async (id: string): Promise<void> => {
    const MAX_ATTEMPTS = 20;
    const INTERVAL_MS = 500;

    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
      try {
        const res = await fetch(`/api/files/${id}`);
        const { files } = await res.json();
        if (Array.isArray(files) && files.length > 0) return;
      } catch {}

      await new Promise((r) => setTimeout(r, INTERVAL_MS));
    }

    console.warn("waitForFiles: timed out");
  };

  const handleTemplateSelect = async (templateId: string) => {
    try {
      
      if (status === "loading") return;

      if (!session) {
        router.push("/auth/login"); 
        return;
      }

      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "my-project",
          template: templateId,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to create project");
      }

      const newProjectId = data.projectId;

      const newUrl = `${window.location.origin}?projectId=${newProjectId}`;
      window.history.pushState({}, "", newUrl);

      setProjectId(newProjectId);

      await waitForFiles(newProjectId);

      setFilesReady(true);
    } catch (err) {
      console.error("Create project failed:", err);
      setFilesReady(true);
    }
  };

  if (isLoading || status === "loading") {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-[#1e1e1e] text-white gap-4">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-gray-400">Loading...</p>
      </div>
    );
  }

  if (!projectId) {
    return <LandingPage onTemplateSelect={handleTemplateSelect} />;
  }

  if (!filesReady) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-[#1e1e1e] text-white gap-4">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-gray-400">
          Setting up your project...
        </p>
      </div>
    );
  }

  return (
    <main className="h-screen flex flex-col">
      <CodeEditor projectId={projectId} />
      {projectId && <FloatingTerminal projectId={projectId} />}
    </main>
  );
}