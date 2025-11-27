"use client"

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react"

type Theme = "dark" | "light"

interface ThemeContextType {
  theme: Theme
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextType>({
  theme: "dark",
  toggleTheme: () => {},
})

// Function to apply theme to DOM
function applyThemeToDOM(newTheme: Theme) {
  if (typeof document === "undefined") return
  document.documentElement.className = newTheme
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("dark")
  const themeRef = useRef<Theme>("dark")

  // Initialize theme from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem("cosmos_theme") as Theme
    const initialTheme = savedTheme === "light" ? "light" : "dark"
    themeRef.current = initialTheme
    setTheme(initialTheme)
    applyThemeToDOM(initialTheme)
  }, [])

  // Toggle theme function - uses ref to avoid stale closure
  const toggleTheme = useCallback(() => {
    const currentTheme = themeRef.current
    const newTheme: Theme = currentTheme === "dark" ? "light" : "dark"
    
    themeRef.current = newTheme
    setTheme(newTheme)
    applyThemeToDOM(newTheme)
    localStorage.setItem("cosmos_theme", newTheme)
  }, [])

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  return useContext(ThemeContext)
}
