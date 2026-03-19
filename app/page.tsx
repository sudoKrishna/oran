import dynamic from "next/dynamic";

const CodeEditor = dynamic(() => import("@/app/components/CodeEditor"), {
  ssr: false, 
});

export default function Home() {
  return (
    <main className="p-6">
      <h1 className="text-xl font-bold mb-4">Monaco Editor</h1>
      <CodeEditor />
    </main>
  );
}