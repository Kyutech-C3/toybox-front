import { create } from "zustand";

import { refreshAccessToken } from "../auth";

type AuthStore = {
  accessToken: string | null;
  isSessionRestoring: boolean;
  restoreSession: () => Promise<boolean>;
  clearAccessToken: () => void;
};

let RESTORE_SESSION_PROMISE: Promise<boolean> | null = null;

export const useAuthStore = create<AuthStore>((set) => ({
  accessToken: null,
  isSessionRestoring: false,
  restoreSession: () => {
    if (RESTORE_SESSION_PROMISE) {
      return RESTORE_SESSION_PROMISE;
    }

    set({ isSessionRestoring: true });
    RESTORE_SESSION_PROMISE = refreshAccessToken()
      .then((accessToken) => {
        set({ accessToken });
        return true;
      })
      .catch(() => {
        set({ accessToken: null });
        return false;
      })
      .finally(() => {
        set({ isSessionRestoring: false });
        RESTORE_SESSION_PROMISE = null;
      });

    return RESTORE_SESSION_PROMISE;
  },
  clearAccessToken: () => {
    set({ accessToken: null });
  },
}));
