import { createContext, useContext, useEffect, useState } from "react";

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  // Default to Light if nothing is saved
  const [mode, setMode] = useState(
    localStorage.getItem("selectedMode") || "Light"
  );
  const isDarkMode = mode === "Dark";

  const toggleMode = () => {
    const newMode = mode === "Light" ? "Dark" : "Light";
    setMode(newMode);
    localStorage.setItem("selectedMode", newMode);

    if (newMode === "Dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  // Initialize on mount
  useEffect(() => {
    if (mode === "Dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, []);

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleMode, mode }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used within a ThemeProvider");
  return context;
};
