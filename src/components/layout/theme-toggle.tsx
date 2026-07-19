"use client";

import { useSyncExternalStore } from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function subscribe() {
  return () => {};
}

// The server always renders "not mounted" (theme is unknown pre-hydration);
// this flips to true on the client's first render after hydration, without
// the extra render pass (and hydration-mismatch risk) a useState+useEffect
// pair would cause.
function useMounted() {
  return useSyncExternalStore(subscribe, () => true, () => false);
}

export function ThemeToggle({ className }: { className?: string }) {
  const { setTheme, resolvedTheme } = useTheme();
  const mounted = useMounted();

  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" aria-label="Toggle theme" className={className}>
        <Sun className="h-4.5 w-4.5" />
      </Button>
    );
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
      aria-label="Toggle theme"
      className={cn("relative", className)}
    >
      <Sun className="h-4.5 w-4.5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-4.5 w-4.5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
    </Button>
  );
}
