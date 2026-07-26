import React, { createContext, useContext, useEffect, useState } from "react";

export type ThemeMode = "dark" | "light" | "cyberpunk" | "system";

type ThemeContextType = {
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  activeTheme: "dark" | "light" | "cyberpunk";
};

const ThemeContext = createContext<ThemeContextType>({
  theme: "dark",
  setTheme: () => {},
  activeTheme: "dark",
});

const THEME_KEY = "chitchat_theme";

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem(THEME_KEY) as ThemeMode;
    if (saved === "dark" || saved === "light" || saved === "cyberpunk" || saved === "system") return saved;
    return "dark";
  });

  const [resolvedTheme, setResolvedTheme] = useState<"dark" | "light" | "cyberpunk">("dark");

  const setTheme = (newTheme: ThemeMode) => {
    setThemeState(newTheme);
    localStorage.setItem(THEME_KEY, newTheme);
  };

  useEffect(() => {
    const getSystemTheme = (): "dark" | "light" => {
      return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    };

    const applyTheme = () => {
      const active = theme === "system" ? getSystemTheme() : theme;
      setResolvedTheme(active);

      const root = document.documentElement;
      const body = document.body;

      root.classList.remove("dark", "light", "cyberpunk");
      body.classList.remove("dark-theme", "light-theme", "cyberpunk-theme");

      root.setAttribute("data-theme", active);
      body.setAttribute("data-theme", active);

      if (active === "dark") {
        root.classList.add("dark");
        body.classList.add("dark-theme");
      } else if (active === "cyberpunk") {
        root.classList.add("dark", "cyberpunk");
        body.classList.add("cyberpunk-theme");
      } else {
        root.classList.add("light");
        body.classList.add("light-theme");
      }
    };

    applyTheme();

    if (theme === "system" && window.matchMedia) {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      const handleChange = () => applyTheme();
      mediaQuery.addEventListener("change", handleChange);
      return () => mediaQuery.removeEventListener("change", handleChange);
    }
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, activeTheme: resolvedTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
