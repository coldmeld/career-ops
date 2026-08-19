"use client";

import { useState } from "react";
import { CheckIcon, CopyIcon } from "lucide-react";
<<<<<<< HEAD
=======
import { Button } from "@/components/ui/button";
>>>>>>> e14ec69774f99feb00dc10fc052e0b397d4d7cae
import { cn } from "@/lib/cn";

// Single-line monospace command + copy-to-clipboard — ported from the
// career-ops-docs home. Truncates on narrow viewports (intent is "copy this").
export function CopyableCommand({
  command,
  className,
}: {
  command: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(command);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Non-secure context or permission denied — fail silently.
    }
  }

  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-xl border border-border bg-surface py-1.5 pl-4 pr-1.5 font-mono text-sm text-muted shadow-sm",
        className,
      )}
    >
      <code className="min-w-0 flex-1 truncate">
        <span className="text-faint">$</span> {command}
      </code>
      <span
        aria-hidden="true"
        className={cn(
          "hidden shrink-0 text-xs font-medium text-brand transition-opacity duration-200 sm:inline-block",
          copied ? "opacity-100" : "opacity-0",
        )}
      >
        Copied
      </span>
<<<<<<< HEAD
      <button
=======
      <Button
        variant="ghost"
        size="icon"
>>>>>>> e14ec69774f99feb00dc10fc052e0b397d4d7cae
        type="button"
        onClick={handleCopy}
        aria-label={copied ? "Copied to clipboard" : "Copy command"}
        title={copied ? "Copied" : "Copy"}
<<<<<<< HEAD
        className="inline-flex shrink-0 items-center justify-center rounded-md p-1.5 text-muted transition-colors hover:bg-surface-hover hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
=======
        className="shrink-0 text-muted"
>>>>>>> e14ec69774f99feb00dc10fc052e0b397d4d7cae
      >
        {copied ? (
          <CheckIcon className="size-4 text-brand" aria-hidden="true" />
        ) : (
          <CopyIcon className="size-4" aria-hidden="true" />
        )}
<<<<<<< HEAD
      </button>
=======
      </Button>
>>>>>>> e14ec69774f99feb00dc10fc052e0b397d4d7cae
    </div>
  );
}
