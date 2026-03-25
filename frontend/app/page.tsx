"use client";

import { useState } from "react";
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

  const handleTemplateSelect = async (templateId: string) => {
    try {
      const res = await fetch("http://localhost:8081/create-project", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: "my-project",
          template: templateId,
        }),
      });

      const data = await res.json();

      console.log("Project created:", data);

      setProjectId(data.projectId);
    } catch (err) {
      console.error("Create project failed", err);
    }
  };

  // Show template picker first
  if (!projectId) {
    return <TemplatePicker onSelect={handleTemplateSelect} />;
  }

  // Show editor after project created
  return (
    <main>
      <CodeEditor projectId={projectId} />

      <div className="h-48 border-t border-gray-700">
        <FloatingTerminal />
      </div>
    </main>
  );
}