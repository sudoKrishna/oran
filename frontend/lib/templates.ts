export const TEMPLATES = [
    {
        id: "node",
        label: "Node.js",
        description: "Node.js starter",
        files: ["index.js", "package.json"],
        defaultFile: "index.js"

    },
    {
        id: "typescript",
        label: "TypeScript",
        description: "TS + ts-node",
        files: ["index.ts", "package.json", "tsconfig.json"],
        defaultFile: "index.ts"
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
]