// ─── Shared Types ─────────────────────────────────────────────────────────────

export type FileNode = {
  name: string;
  path: string;
  type: "file" | "folder";
  content?: string;
  children?: FileNode[];
};

export type OpenFile = {
  name: string;
  path: string;
  content: string;
  isDirty: boolean;
};

export type AiTab = "issues" | "suggest" | "chat";

export type AiMessage = { role: string; content: string };

export type ActiveUser = {
  userId: string;
  name: string | null;
  email: string | null;
  color: string;
};