import { diffLines } from "diff";
import { useMemo } from "react";

interface DiffViewProps {
  oldCode: string;
  newCode: string;
  language: string;
}

export function DiffView({ oldCode, newCode, language }: DiffViewProps) {
  const diff = useMemo(() => diffLines(oldCode, newCode), [oldCode, newCode]);

  return (
    <div className="font-mono text-sm bg-muted/30 rounded-md overflow-hidden border">
      {diff.map((part, index) => {
        const color = part.added
          ? "bg-green-500/20 text-green-700 dark:text-green-300"
          : part.removed
            ? "bg-red-500/20 text-red-700 dark:text-red-300"
            : "text-muted-foreground";

        const prefix = part.added ? "+ " : part.removed ? "- " : "  ";

        return (
          <div key={index} className={`${color} px-4 py-0.5 whitespace-pre-wrap`}>
            {part.value.split("\n").map((line, i) => {
              if (i === part.value.split("\n").length - 1 && line === "") return null;
              return (
                <div key={i} className="flex">
                  <span className="w-6 select-none opacity-50">{prefix}</span>
                  <span>{line}</span>
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
