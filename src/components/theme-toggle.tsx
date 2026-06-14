"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Monitor, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" className="h-9 w-9" disabled>
        <Sun className="h-4 w-4" />
      </Button>
    );
  }

  const next = theme === "dark" ? "light" : theme === "light" ? "system" : "dark";
  const Icon = theme === "dark" ? Moon : theme === "light" ? Sun : Monitor;
  const label = `Switch to ${next} mode`;

  return (
    <Button
      id="theme-toggle"
      variant="ghost"
      size="icon"
      className="h-9 w-9 cursor-pointer"
      onClick={() => setTheme(next)}
      aria-label={label}
      title={label}
    >
      <Icon className="h-4 w-4 transition-transform duration-200" />
    </Button>
  );
}
