"use client";

import dynamic from "next/dynamic";
const FloatingTerminal = dynamic(() => import("@/app/components/FloatingTerminal"), {
  ssr: false,
})

const CodeEditor = dynamic(() => import("@/app/components/CodeEditor"), {
  ssr: false,
});


export default function Home() {
  return (
    <main >
      <CodeEditor />

      <div className="h-48 border-t border-gray-700">
        <FloatingTerminal />
      </div>
    </main>
  );
}