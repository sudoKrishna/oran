"use client";

import dynamic from "next/dynamic";

const CodeEditor = dynamic(() => import("@/app/components/CodeEditor"), {
  ssr: false,
});
const WebTerminal = dynamic(() => import("@/app/components/WebTerminal") , {
  ssr : false
})

export default function Home() {
  return (
    <main >
      <CodeEditor />

      <div className="h-48 border-t border-gray-700">
        <WebTerminal />
      </div>
    </main>
  );
}