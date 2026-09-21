import { mutate } from "swr";
import { beforeEach } from "vitest";

import { useAuthStore } from "@/features/auth/store/useAuthStore";
import { useUserStore } from "@/features/auth/store/useUserStore";
import "../index.css";

beforeEach(async () => {
  await mutate(() => true, undefined, { revalidate: true });
  useAuthStore.setState({
    accessToken: null,
    sessionVersion: 0,
    isInitialized: true,
  });
  useUserStore.getState().clearUser();
});
