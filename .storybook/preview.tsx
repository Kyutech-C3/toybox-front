/// <reference types="vite/client" />

import { useEffect, useLayoutEffect } from "react";
import { useGlobals } from "storybook/preview-api";

import type { Preview } from "@storybook/react-vite";
import "../src/index.css";
import "./preview.css";

import {
  getCurrentTheme,
  setTheme,
  subscribeTheme,
  type Theme,
} from "../src/util/theme";

import type { ReactNode } from "react";

type ThemeDecoratorProps = {
  children: ReactNode;
  theme: Theme;
  onThemeChange: (theme: Theme) => void;
};

const ThemeDecorator = ({
  children,
  theme,
  onThemeChange,
}: ThemeDecoratorProps) => {
  useLayoutEffect(() => {
    setTheme(theme);
  }, [theme]);

  useEffect(
    () => subscribeTheme(() => onThemeChange(getCurrentTheme())),
    [onThemeChange],
  );

  return children;
};

const preview: Preview = {
  globalTypes: {
    theme: {
      description: "作品表示のテーマ",
      toolbar: {
        title: "テーマ",
        icon: "circlehollow",
        items: [
          { value: "light", title: "ライト" },
          { value: "dark", title: "ダーク" },
        ],
        dynamicTitle: true,
      },
    },
  },
  initialGlobals: {
    theme: "light",
  },
  decorators: [
    (Story) => {
      const [globals, updateGlobals] = useGlobals();
      const theme: Theme = globals.theme === "dark" ? "dark" : "light";
      return (
        <ThemeDecorator
          theme={theme}
          onThemeChange={(currentTheme) => {
            if (currentTheme !== theme) {
              updateGlobals({ theme: currentTheme });
            }
          }}
        >
          <Story />
        </ThemeDecorator>
      );
    },
  ],
  parameters: {
    backgrounds: { disable: true },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },

    a11y: {
      test: "error",
    },
  },
};

export default preview;
