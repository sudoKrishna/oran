
export const TEMPLATES = [
  {
    id: "node",
    label: "Node.js",
    description: "Node.js starter",
    files: ["index.js", "package.json"],
    defaultFile: "index.js",
  },
  {
    id: "typescript",
    label: "TypeScript",
    description: "TS + ts-node",
    files: ["index.ts", "package.json", "tsconfig.json"],
    defaultFile: "index.ts",
  },
  {
    id: "react",
    label: "React",
    description: "Vite + React",
    files: ["src/App.jsx", "src/main.jsx", "index.html", "package.json"],
    defaultFile: "src/App.jsx",
  },
  {
    id: "nextjs",
    label: "Next.js",
    description: "App router starter",
    files: ["app/page.tsx", "app/layout.tsx", "package.json", "next.config.js"],
    defaultFile: "app/page.tsx",
  },
];


type TemplateFile = {
  path: string;
  content: string;
  language: string;
};

export const TEMPLATE_FILES: Record<string, TemplateFile[]> = {
  node: [
    {
      path: "index.js",
      language: "javascript",
      content: `// Node.js starter
const http = require("http");

const PORT = process.env.PORT || 3000;

const server = http.createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end("Hello from Node.js!\\n");
});

server.listen(PORT, () => {
  console.log(\`Server running at http://localhost:\${PORT}\`);
});
`,
    },
    {
      path: "package.json",
      language: "json",
      content: JSON.stringify(
        {
          name: "node-starter",
          version: "1.0.0",
          description: "Node.js starter project",
          main: "index.js",
          scripts: {
            start: "node index.js",
          },
        },
        null,
        2
      ),
    },
  ],

  typescript: [
    {
      path: "index.ts",
      language: "typescript",
      content: `// TypeScript starter
const greet = (name: string): string => {
  return \`Hello, \${name}!\`;
};

console.log(greet("World"));
`,
    },
    {
      path: "package.json",
      language: "json",
      content: JSON.stringify(
        {
          name: "typescript-starter",
          version: "1.0.0",
          scripts: {
            start: "ts-node index.ts",
            build: "tsc",
          },
          devDependencies: {
            typescript: "^5.0.0",
            "ts-node": "^10.9.1",
            "@types/node": "^20.0.0",
          },
        },
        null,
        2
      ),
    },
    {
      path: "tsconfig.json",
      language: "json",
      content: JSON.stringify(
        {
          compilerOptions: {
            target: "ES2020",
            module: "commonjs",
            strict: true,
            esModuleInterop: true,
            outDir: "./dist",
            rootDir: "./",
          },
          include: ["*.ts"],
          exclude: ["node_modules", "dist"],
        },
        null,
        2
      ),
    },
  ],

  react: [
    {
      path: "src/App.jsx",
      language: "javascript",
      content: `import { useState } from "react";

export default function App() {
  const [count, setCount] = useState(0);

  return (
    <div style={{ fontFamily: "sans-serif", textAlign: "center", marginTop: "4rem" }}>
      <h1>Vite + React</h1>
      <button onClick={() => setCount((c) => c + 1)}>
        Count: {count}
      </button>
    </div>
  );
}
`,
    },
    {
      path: "src/main.jsx",
      language: "javascript",
      content: `import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
`,
    },
    {
      path: "index.html",
      language: "html",
      content: `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>React App</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
`,
    },
    {
      path: "package.json",
      language: "json",
      content: JSON.stringify(
        {
          name: "react-starter",
          version: "1.0.0",
          scripts: {
            dev: "vite",
            build: "vite build",
            preview: "vite preview",
          },
          dependencies: {
            react: "^18.2.0",
            "react-dom": "^18.2.0",
          },
          devDependencies: {
            "@vitejs/plugin-react": "^4.0.0",
            vite: "^5.0.0",
          },
        },
        null,
        2
      ),
    },
  ],

  nextjs: [
    {
      path: "app/page.tsx",
      language: "typescript",
      content: `export default function Home() {
  return (
    <main style={{ fontFamily: "sans-serif", padding: "2rem" }}>
      <h1>Next.js App Router Starter</h1>
      <p>Edit <code>app/page.tsx</code> to get started.</p>
    </main>
  );
}
`,
    },
    {
      path: "app/layout.tsx",
      language: "typescript",
      content: `import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Next.js Starter",
  description: "Generated by create next app",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
`,
    },
    {
      path: "next.config.js",
      language: "javascript",
      content: `/** @type {import('next').NextConfig} */
const nextConfig = {};

module.exports = nextConfig;
`,
    },
    {
      path: "package.json",
      language: "json",
      content: JSON.stringify(
        {
          name: "nextjs-starter",
          version: "0.1.0",
          scripts: {
            dev: "next dev",
            build: "next build",
            start: "next start",
          },
          dependencies: {
            next: "14.0.0",
            react: "^18",
            "react-dom": "^18",
          },
          devDependencies: {
            typescript: "^5",
            "@types/node": "^20",
            "@types/react": "^18",
          },
        },
        null,
        2
      ),
    },
  ],
};