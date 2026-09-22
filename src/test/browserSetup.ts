import { unload } from "swr";
import { beforeEach, vi } from "vitest";

import { useAuthStore } from "@/features/auth/store/useAuthStore";
import { useUserStore } from "@/features/auth/store/useUserStore";
import "../index.css";

const SWR_SUSPENSE_WARNING =
  "A component was suspended by an uncached promise. Creating promises inside a Client Component or hook is not yet supported, except via a Suspense-compatible library or framework.";

beforeEach(() => {
  const originalConsoleError = console.error.bind(console);
  vi.spyOn(console, "error").mockImplementation((...args) => {
    // SWR 2.5 recreates its Suspense promise under React 19 (vercel/swr#4314).
    if (
      args.some((argument) => String(argument).includes(SWR_SUSPENSE_WARNING))
    )
      return;
    originalConsoleError(...args);
  });
  unload({ revalidate: false });
  useAuthStore.setState({
    accessToken: null,
    sessionVersion: 0,
    isInitialized: true,
  });
  useUserStore.getState().clearUser();
});
