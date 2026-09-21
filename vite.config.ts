/// <reference types="vitest/config" />

import { storybookTest } from "@storybook/addon-vitest/vitest-plugin";
import react from "@vitejs/plugin-react";
import { playwright } from "@vitest/browser-playwright";
import { defineConfig } from "vite";

import path from "node:path";

// More info at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "./src"),
    },
  },
  test: {
    maxWorkers: 4,
    coverage: {
      thresholds: { statements: 80, branches: 65, functions: 80, lines: 80 },
      provider: "v8",
      reportOnFailure: true,
      reporter: ["text", "html", "json-summary"],
      include: ["src/**/*.{ts,tsx}"],
      exclude: [
        "src/**/*.stories.tsx",
        "src/**/*.test.{ts,tsx}",
        "src/test/**",
        "src/**/*.d.ts",
        "src/shared/mocks/**",
        "src/main.tsx",
      ],
    },
    projects: [
      {
        extends: true,
        test: {
          name: "unit",
          include: ["src/**/*.test.ts"],
          environment: "node",
          restoreMocks: true,
          unstubGlobals: true,
        },
      },
      {
        extends: true,
        optimizeDeps: {
          include: [
            "@mui/icons-material/AccessTimeRounded",
            "@mui/icons-material/AddRounded",
            "@mui/icons-material/ArrowDropUpRounded",
            "@mui/icons-material/AudiotrackRounded",
            "@mui/icons-material/AutorenewRounded",
            "@mui/icons-material/Check",
            "@mui/icons-material/ChevronLeftRounded",
            "@mui/icons-material/ChevronRightRounded",
            "@mui/icons-material/Close",
            "@mui/icons-material/CloseRounded",
            "@mui/icons-material/CloudUploadRounded",
            "@mui/icons-material/ContentCopy",
            "@mui/icons-material/DownloadRounded",
            "@mui/icons-material/EditNoteRounded",
            "@mui/icons-material/FavoriteRounded",
            "@mui/icons-material/FolderZipRounded",
            "@mui/icons-material/FullscreenExitRounded",
            "@mui/icons-material/FullscreenRounded",
            "@mui/icons-material/GitHub",
            "@mui/icons-material/HelpOutlineRounded",
            "@mui/icons-material/InsertDriveFileRounded",
            "@mui/icons-material/IosShareRounded",
            "@mui/icons-material/LanguageRounded",
            "@mui/icons-material/LockRounded",
            "@mui/icons-material/LoginRounded",
            "@mui/icons-material/MovieRounded",
            "@mui/icons-material/MusicNoteRounded",
            "@mui/icons-material/PauseRounded",
            "@mui/icons-material/PlayArrowRounded",
            "@mui/icons-material/PublicRounded",
            "@mui/icons-material/Refresh",
            "@mui/icons-material/RefreshRounded",
            "@mui/icons-material/SaveRounded",
            "@mui/icons-material/SendRounded",
            "@mui/icons-material/VerticalSplitRounded",
            "@mui/icons-material/ViewInArRounded",
            "@mui/icons-material/VisibilityRounded",
            "@mui/icons-material/VolumeOffRounded",
            "@mui/icons-material/VolumeUpRounded",
            "@mui/icons-material/X",
            "@mui/material/Alert",
            "@mui/material/Snackbar",
            "@uiw/react-md-editor",
            "react",
            "react-dom",
            "react-dom/client",
            "react-markdown",
            "react-router-dom",
            "react-syntax-highlighter",
            "react-syntax-highlighter/dist/esm/styles/prism",
            "rehype-sanitize",
            "remark-breaks",
            "remark-gfm",
            "swr",
            "three",
            "three/addons/controls/OrbitControls.js",
            "three/addons/loaders/FBXLoader.js",
            "three/addons/loaders/GLTFLoader.js",
            "zustand",
          ],
        },
        test: {
          name: "browser",
          include: ["src/**/*.browser.test.tsx"],
          setupFiles: ["./src/test/browserSetup.ts"],
          restoreMocks: true,
          unstubGlobals: true,
          browser: {
            enabled: true,
            headless: true,
            provider: playwright(),
            instances: [{ browser: "chromium" }],
          },
        },
      },
      {
        extends: true,
        plugins: [
          // The plugin will run tests for the stories defined in your Storybook config
          // See options at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon#storybooktest
          storybookTest({
            configDir: path.join(import.meta.dirname, ".storybook"),
          }),
        ],
        test: {
          name: "storybook",
          browser: {
            enabled: true,
            headless: true,
            provider: playwright(),
            instances: [
              {
                browser: "chromium",
              },
            ],
          },
        },
      },
    ],
  },
});
