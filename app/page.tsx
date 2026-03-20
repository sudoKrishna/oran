"use client";

import dynamic from "next/dynamic";

const CodeEditor = dynamic(() => import("@/app/components/CodeEditor"), {
  ssr: false, 
});

export default function Home() {
  return (
    <main >
      <CodeEditor />
    </main>
  );
}