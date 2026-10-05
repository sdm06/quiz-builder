"use client";

import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";

import { Button } from "@/components/ui/button";

/**
 * Light/dark switch.
 *
 * The icons are driven purely by CSS (`dark:` variants keyed off the class that
 * next-themes puts on <html>), so there is no mounted flag and no
 * server/client hydration mismatch. `resolvedTheme` is only read inside the
 * click handler, never during render.
 */
export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
      aria-label="Toggle colour theme"
      title="Toggle colour theme"
    >
      <Sun className="h-4 w-4 scale-100 rotate-0 transition-transform duration-200 dark:scale-0 dark:-rotate-90" />
      <Moon className="absolute h-4 w-4 scale-0 rotate-90 transition-transform duration-200 dark:scale-100 dark:rotate-0" />
    </Button>
  );
}