import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { ThemeContext } from "./theme-context";

type Theme = "light" | "dark";

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() =>
    localStorage.getItem("chat-theme") === "dark" ? "dark" : "light",
  );

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("chat-theme", theme);
  }, [theme]);

  const value = {
    theme,
    toggleTheme: () =>
      setTheme((current) => (current === "light" ? "dark" : "light")),
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
