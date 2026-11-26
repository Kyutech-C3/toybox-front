import { create } from "zustand";

// JWTはHttpOnly CookieでやりとりするためJSからは読めない。storeはログイン状態のみを持つ。
type AuthStore = {
  isAuthenticated: boolean;
  sessionVersion: number;
  isInitialized: boolean;
  hasRestoreFailed: boolean;
  startSession: () => void;
  setAuthenticated: () => void;
  clearAuth: () => void;
  setInitialized: () => void;
  setRestoreFailed: (hasRestoreFailed: boolean) => void;
};

export const useAuthStore = create<AuthStore>()((set) => ({
  isAuthenticated: false,
  sessionVersion: 0,
  isInitialized: false,
  hasRestoreFailed: false,
  startSession: () => {
    set((state) => ({
      isAuthenticated: true,
      hasRestoreFailed: false,
      sessionVersion: state.sessionVersion + 1,
    }));
  },
  setAuthenticated: () => {
    set({ isAuthenticated: true, hasRestoreFailed: false });
  },
  clearAuth: () => {
    set((state) => ({
      isAuthenticated: false,
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
