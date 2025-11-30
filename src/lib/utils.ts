import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const CODE_LANGUAGES = [
  { value: "javascript", label: "JavaScript" },
  { value: "typescript", label: "TypeScript" },
  { value: "python", label: "Python" },
  { value: "java", label: "Java" },
  { value: "cpp", label: "C++" },
  { value: "csharp", label: "C#" },
  { value: "go", label: "Go" },
  { value: "rust", label: "Rust" },
  { value: "html", label: "HTML" },
  { value: "css", label: "CSS" },
  { value: "json", label: "JSON" },
  { value: "sql", label: "SQL" },
];

export const LANGUAGE_EXTENSION_MAP: Record<string, string> = {
  javascript: "jsx",
  typescript: "tsx",
  python: "py",
  java: "java",
  cpp: "cpp",
  csharp: "cs",
  go: "go",
  rust: "rs",
  html: "html",
  css: "css",
  json: "json",
  sql: "sql",
};
