export type Theme = "dark" | "light";

export const getTheme = (): Theme => {
  const stored = localStorage.getItem("theme") as Theme | null;
  return stored ?? "dark"; // default = DARK
};

export const setTheme = (theme: Theme) => {
  localStorage.setItem("theme", theme);

  if (theme === "dark") {
    document.documentElement.classList.add("dark");
  } else {
    document.documentElement.classList.remove("dark");
  }
};

export const toggleTheme = () => {
  const next = getTheme() === "dark" ? "light" : "dark";
  setTheme(next);
  return next;
};
