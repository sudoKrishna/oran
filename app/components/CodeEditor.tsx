// components/CodeEditor.tsx
"use client";

import Editor from "@monaco-editor/react";
import { useState } from "react";

export default function CodeEditor() {
  const [code, setCode] = useState("// start coding...");

  return (
    <div className="h-[500px] border rounded-xl overflow-hidden">
      <Editor
        height="100%"
        defaultLanguage="javascript"
        theme="vs-dark"
        value={code}
        onChange={(value) => setCode(value || "")}
      />
    </div>
  );
}