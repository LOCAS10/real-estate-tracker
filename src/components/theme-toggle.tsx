"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);
  if (!mounted) return <Button variant="ghost" size="icon" className="h-8 w-8" disabled />;

  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-8 w-8 text-sidebar-foreground/70 hover:text-sidebar-foreground"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      title={theme === "dark" ? "الوضع النهاري" : "الوضع الليلي"}
    >
      {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
    </Button>
  );
}
