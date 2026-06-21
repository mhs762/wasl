import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { useColorScheme } from "react-native";
import buildColors, { ThemeColor } from "@/constants/colors";

type ColorScheme = "dark" | "light" | "system";

interface ThemeContextType {
  colors: ReturnType<typeof buildColors>;
  isDark: boolean;
  colorScheme: ColorScheme;
  accentColor: ThemeColor;
  setColorScheme: (scheme: ColorScheme) => void;
  setAccentColor: (color: ThemeColor) => void;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

const SCHEME_KEY = "@wasl_color_scheme";
const ACCENT_KEY = "@wasl_accent_color";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const [colorScheme, setColorSchemeState] = useState<ColorScheme>("dark");
  const [accentColor, setAccentColorState] = useState<ThemeColor>("purple");

  useEffect(() => {
    (async () => {
      const savedScheme = await AsyncStorage.getItem(SCHEME_KEY);
      const savedAccent = await AsyncStorage.getItem(ACCENT_KEY);
      if (savedScheme) setColorSchemeState(savedScheme as ColorScheme);
      if (savedAccent) setAccentColorState(savedAccent as ThemeColor);
    })();
  }, []);

  const isDark =
    colorScheme === "system" ? systemScheme === "dark" : colorScheme === "dark";

  const setColorScheme = useCallback(async (scheme: ColorScheme) => {
    setColorSchemeState(scheme);
    await AsyncStorage.setItem(SCHEME_KEY, scheme);
  }, []);

  const setAccentColor = useCallback(async (color: ThemeColor) => {
    setAccentColorState(color);
    await AsyncStorage.setItem(ACCENT_KEY, color);
  }, []);

  const colors = buildColors(accentColor, isDark);

  return (
    <ThemeContext.Provider
      value={{ colors, isDark, colorScheme, accentColor, setColorScheme, setAccentColor }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used inside ThemeProvider");
  return ctx;
}
