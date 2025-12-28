"use client";

import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/app/components/ui/Button";
import { useEffect, useState } from "react";

export function ModeToggle() {
  const { theme, setTheme, systemTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  const currentTheme = theme === "system" ? systemTheme : theme;

  return (
    <Button
      variant="outline"
      size="icon"
      className="rounded-full h-10 w-10"
      onClick={() => setTheme(currentTheme === "dark" ? "light" : "dark")}
    >
      <Sun className="h-[1.2rem] w-[1.2rem] transition-all dark:hidden" />
      <Moon className="h-[1.2rem] w-[1.2rem] hidden dark:block" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}
