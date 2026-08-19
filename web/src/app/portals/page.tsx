import { Radar } from "lucide-react";
import { PortalsView } from "@/components/portals-view";

export const dynamic = "force-dynamic";

export default function PortalsPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-8">
      <div className="flex items-center gap-3">
        <Radar className="size-6 text-brand" />
        <h1 className="font-display text-2xl tracking-tight text-landing">Portals</h1>
      </div>
      <p className="mt-1.5 max-w-xl text-sm text-muted">
<<<<<<< HEAD
        The companies the scanner watches for new roles (<code className="text-foreground">portals.yml</code>). Run a
        health check to catch ATS slugs that have quietly broken — a 404 means that company silently disappears from
        every future scan.
=======
        The companies career-ops watches for new roles. Run a health check to catch company boards that have quietly
        broken — a broken link means that company silently disappears from every future scan.
      </p>
      <p className="mt-1.5 text-xs text-faint">
        Backed by <code className="text-muted">portals.yml</code> — edit it directly or ask the assistant.
>>>>>>> e14ec69774f99feb00dc10fc052e0b397d4d7cae
      </p>
      <div className="mt-6">
        <PortalsView />
      </div>
    </div>
  );
}
