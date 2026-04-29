"use client";

import { useTheme } from "next-themes";
import { Monitor, Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import {
  APPEARANCE_STYLES,
  getComponentRoundness,
  getThemeConfig,
} from "@/lib/theme";

function getThemeToggleRoundness() {
  return getComponentRoundness("themeSwitch");
}

function getThemeSwitchCardAppearance(): string {
  const themeConfig = getThemeConfig();
  const appearance = APPEARANCE_STYLES[themeConfig.appearance];
  return appearance?.card || "bg-black/5 dark:bg-white/5";
}

function getSelectedButtonStyle(isSelected: boolean): string {
  const themeConfig = getThemeConfig();

  if (!isSelected) {
    return "text-gray-400 hover:text-gray-300 dark:text-gray-500 dark:hover:text-gray-400";
  }

  switch (themeConfig.appearance) {
    case "glass":
      return "bg-white/30 dark:bg-black/30 text-gray-900 dark:text-white shadow-lg backdrop-blur-sm border border-white/40 dark:border-white/20";
    case "material":
      return "bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-md";
    case "flat":
    default:
      return "bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700";
  }
}

const OPTIONS = [
  { value: "light", label: "Switch to light mode", Icon: Sun },
  { value: "system", label: "Follow system preference", Icon: Monitor },
  { value: "dark", label: "Switch to dark mode", Icon: Moon },
] as const;

export default function ThemeSwitch() {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();
  const toggleRoundness = getThemeToggleRoundness();
  const cardAppearance = getThemeSwitchCardAppearance();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div
      className={`flex space-x-1 p-1 ${toggleRoundness} ${cardAppearance}`}
      role="group"
      aria-label="Theme"
    >
      {OPTIONS.map(({ value, label, Icon }) => (
        <button
          key={value}
          type="button"
          className={`w-8 h-8 flex flex-row items-center justify-center ${toggleRoundness} transition-colors ${getSelectedButtonStyle(theme === value)}`}
          onClick={() => setTheme(value)}
          aria-pressed={theme === value}
          aria-label={label}
        >
          <Icon className="h-4 w-4" />
        </button>
      ))}
    </div>
  );
}
