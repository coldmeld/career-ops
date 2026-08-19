"use client";

import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";
<<<<<<< HEAD
=======
import { Button } from "@/components/ui/button";
>>>>>>> e14ec69774f99feb00dc10fc052e0b397d4d7cae
import { cn } from "@/lib/cn";

const KEY = "career-ops:theme";

export function ThemeToggle({ className }: { className?: string }) {
  const [dark, setDark] = useState(true);

  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
  }, []);

  function toggle() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    // keep the browser chrome (Safari status bar / Dynamic Island) tinted to match
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", next ? "#0a0a0a" : "#f7f6f3");
    try {
      localStorage.setItem(KEY, next ? "dark" : "light");
    } catch {
      /* ignore */
    }
    // let theme-reactive components (shaders) re-read
    window.dispatchEvent(new Event("themechange"));
  }

  return (
<<<<<<< HEAD
    <button
=======
    <Button
      variant="ghost"
      size="icon"
>>>>>>> e14ec69774f99feb00dc10fc052e0b397d4d7cae
      type="button"
      onClick={toggle}
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      title={dark ? "Light mode" : "Dark mode"}
<<<<<<< HEAD
      className={cn(
        "inline-flex items-center justify-center rounded-md p-1.5 text-muted transition-colors hover:bg-surface-hover hover:text-foreground",
        className,
      )}
    >
      {dark ? <Sun className="size-4" /> : <Moon className="size-4" />}
    </button>
=======
      className={cn("text-muted", className)}
    >
      {dark ? <Sun className="size-4" /> : <Moon className="size-4" />}
    </Button>
>>>>>>> e14ec69774f99feb00dc10fc052e0b397d4d7cae
  );
}
