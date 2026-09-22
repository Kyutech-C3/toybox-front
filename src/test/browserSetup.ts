import { unload } from "swr";
import { beforeEach } from "vitest";

import { useAuthStore } from "@/features/auth/store/useAuthStore";
import { useUserStore } from "@/features/auth/store/useUserStore";
import "../index.css";

beforeEach(() => {
  unload({ revalidate: false });
  useAuthStore.setState({
    accessToken: null,
    sessionVersion: 0,
    isInitialized: true,
  });
  useUserStore.getState().clearUser();
});
