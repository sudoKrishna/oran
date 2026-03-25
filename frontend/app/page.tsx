"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import TemplatePicker from "@/app/components/TemplatePicker";

const FloatingTerminal = dynamic(
  () => import("@/app/components/FloatingTerminal"),
  { ssr: false }
);

const CodeEditor = dynamic(
  () => import("@/app/components/CodeEditor"),
  { ssr: false }
);

export default function Home() {
  const [projectId, setProjectId] = useState<string | null>(null);


  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const idFromUrl = urlParams.get("projectId");

    if (idFromUrl) {
      setProjectId(idFromUrl);
    }
  }, []);

  const handleTemplateSelect = async (templateId: string) => {
    try {
      const res = await fetch("http://localhost:8081/create-project", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "my-project",
          template: templateId,
        }),
      });

      const data = await res.json();
      const newProjectId = data.projectId;

      console.log("Project created:", newProjectId);

      
      const newUrl = `${window.location.origin}?projectId=${newProjectId}`;
      window.history.pushState({}, "", newUrl);

      setProjectId(newProjectId);
    } catch (err) {
      console.error("Create project failed", err);
    }
  };

  if (!projectId) {
    return <TemplatePicker onSelect={handleTemplateSelect} />;
  }

  return (
    <main className="h-screen flex flex-col">
      <CodeEditor projectId={projectId} />

      <div className="h-48 border-t border-gray-700 flex-shrink-0">
        <FloatingTerminal  />   
      </div>
    </main>
  );
}