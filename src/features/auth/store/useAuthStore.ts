import { create } from "zustand";

type AuthStore = {
  accessToken: string | null;
  sessionVersion: number;
  isInitialized: boolean;
  startSession: (accessToken: string) => void;
  setAccessToken: (accessToken: string) => void;
  clearAuth: () => void;
  setInitialized: () => void;
};

export const useAuthStore = create<AuthStore>()((set) => ({
  accessToken: null,
  sessionVersion: 0,
  isInitialized: false,
  startSession: (accessToken) => {
    set((state) => ({
      accessToken,
      sessionVersion: state.sessionVersion + 1,
    }));
  },
  setAccessToken: (accessToken) => {
    set({ accessToken });
  },
  clearAuth: () => {
    set((state) => ({
      accessToken: null,
      sessionVersion: state.sessionVersion + 1,
    }));
  },
  setInitialized: () => {
    set({ isInitialized: true });
  },
}));
