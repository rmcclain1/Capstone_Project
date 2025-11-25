import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Appearance, ColorSchemeName, StatusBar } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Colors from "./theme";

type Preference = "system" | "light" | "dark";

type ThemeContextShape = {
  theme: Colors.Tokens;
  preference: Preference;
  setPreference: (p: Preference) => Promise<void>;
  isDark: boolean;
};

const ThemeContext = createContext<ThemeContextShape>(null as any);
const KEY = "theme.preference";

function pickTheme(pref: Preference, system: ColorSchemeName): Colors.Tokens {
  const name: Colors.ThemeName =
    pref === "system"
      ? system === "dark"
        ? "dark"
        : "light"
      : (pref as "light" | "dark");
  return name === "dark" ? Colors.dark : Colors.light;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [preference, setPref] = useState<Preference>("light");
  const [systemScheme, setSystemScheme] = useState<ColorSchemeName>(
    Appearance.getColorScheme(),
  );

  useEffect(() => {
    const sub = Appearance.addChangeListener(({ colorScheme }) =>
      setSystemScheme(colorScheme),
    );
    return () => sub.remove();
  }, []);

  useEffect(() => {
    (async () => {
      const saved = await AsyncStorage.getItem(KEY);
      if (saved === "light" || saved === "dark" || saved === "system") {
        setPref(saved as Preference);
      } else {
        setPref("light");
      }
    })();
  }, []);

  const theme = useMemo(
    () => pickTheme(preference, systemScheme),
    [preference, systemScheme],
  );
  const isDark = theme.name === "dark";

  const setPreference = useCallback(async (p: Preference) => {
    setPref(p);
    await AsyncStorage.setItem(KEY, p);
  }, []);

  useEffect(() => {
    StatusBar.setBarStyle(isDark ? "light-content" : "dark-content");
  }, [isDark]);

  return (
    <ThemeContext.Provider value={{ theme, preference, setPreference, isDark }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
