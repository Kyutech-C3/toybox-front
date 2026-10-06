import { create } from "zustand";

type AuthStore = {
  accessToken: string | null;
  sessionVersion: number;
  isInitialized: boolean;
  hasRestoreFailed: boolean;
  startSession: (accessToken: string) => void;
  setAccessToken: (accessToken: string) => void;
  clearAuth: () => void;
  setInitialized: () => void;
  setRestoreFailed: (hasRestoreFailed: boolean) => void;
};

export const useAuthStore = create<AuthStore>()((set) => ({
  accessToken: null,
  sessionVersion: 0,
  isInitialized: false,
  hasRestoreFailed: false,
  startSession: (accessToken) => {
    set((state) => ({
      accessToken,
      hasRestoreFailed: false,
      sessionVersion: state.sessionVersion + 1,
    }));
  },
  setAccessToken: (accessToken) => {
    set({ accessToken, hasRestoreFailed: false });
  },
  clearAuth: () => {
    set((state) => ({
      accessToken: null,
      hasRestoreFailed: false,
      sessionVersion: state.sessionVersion + 1,
    }));
  },
  setInitialized: () => {
    set({ isInitialized: true });
  },
  setRestoreFailed: (hasRestoreFailed) => {
    set({ hasRestoreFailed });
  },
}));
