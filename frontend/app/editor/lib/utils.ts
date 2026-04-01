// ─── Utility Helpers ──────────────────────────────────────────────────────────

export function getLanguage(filename: string): string {
  if (filename.endsWith(".ts") || filename.endsWith(".tsx")) return "typescript";
  if (filename.endsWith(".jsx") || filename.endsWith(".js")) return "javascript";
  if (filename.endsWith(".json")) return "json";
  if (filename.endsWith(".css")) return "css";
  if (filename.endsWith(".html")) return "html";
  if (filename.endsWith(".md")) return "markdown";
  return "plaintext";
}

export function fileIcon(name: string): string {
  const ext = name.split(".").pop();
  const map: Record<string, string> = {
    ts: "󰛦", tsx: "󰜈", js: "󰌞", jsx: "󰜈", json: "", css: "",
    html: "", md: "", py: "", go: "", rb: "",
  };
  return map[ext ?? ""] ?? "";
}