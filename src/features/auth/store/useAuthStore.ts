import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { getAccessToken, refreshAccessToken } from "../auth";

type AuthStore = {
  accessToken: string | null;
  getAccessToken: (code: string) => Promise<void>;
  refreshAccessToken: () => Promise<void>;
};

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      accessToken: null,
      getAccessToken: async (code: string) => {
        const accessToken = await getAccessToken(code);
        set({ accessToken: accessToken });
      },
      refreshAccessToken: async () => {
        const currentToken = get().accessToken;
        if (!currentToken) {
          throw new Error("No access token available");
        }
        const newAccessToken = await refreshAccessToken(currentToken);
        set({ accessToken: newAccessToken });
      },
    }),
    {
      name: "auth-storage",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
