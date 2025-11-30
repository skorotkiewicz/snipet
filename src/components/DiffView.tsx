import { diffLines } from "diff";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";

interface DiffViewProps {
  oldCode: string;
  newCode: string;
  language: string;
}

export function DiffView({ oldCode, newCode }: DiffViewProps) {
  const diff = useMemo(() => diffLines(oldCode, newCode), [oldCode, newCode]);
  const [isCopied, setIsCopied] = useState(false);

  return (
    <div className="relative group">
      <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          variant="secondary"
          size="sm"
          className="h-8 text-xs bg-background/80 hover:bg-background shadow-sm transition-all w-24"
          onClick={() => {
            navigator.clipboard.writeText(oldCode);
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 1000);
          }}
        >
          {isCopied ? "Copied!" : "Copy"}
        </Button>
      </div>
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
    </div>
  );
}
