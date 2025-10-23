"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const currentTheme = theme ?? resolvedTheme ?? "system";

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label="Toggle theme"
      onClick={() => setTheme(currentTheme === "dark" ? "light" : "dark")}
    >
      {mounted && (currentTheme === "dark" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />)}
      {!mounted && <Sun className="h-4 w-4" />}
    </Button>
  );
}
