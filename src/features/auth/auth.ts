import { mutate } from "swr";

import { useAuthStore } from "./store/useAuthStore";
import { useUserStore } from "./store/useUserStore";

import { API_BASE_URL } from "@/util/apiConfig";

type AccessTokenResponse = {
  access_token?: string;
};

type LoginURLResponse = {
  url?: string;
};

let REFRESH_REQUEST: Promise<string> | null = null;
let CALLBACK_REQUEST: Promise<string> | null = null;

const removeLegacyAuthStorage = () => {
  localStorage.removeItem("auth-storage");
  localStorage.removeItem("user-storage");
};

const clearAuthSession = async () => {
  removeLegacyAuthStorage();
  useAuthStore.getState().clearAuth();
  useUserStore.getState().clearUser();
  await mutate((key) => Array.isArray(key), undefined, { revalidate: false });
};

const getLoginUrl = async () => {
  const request = await fetch(`${API_BASE_URL}/auth/discord`, {
    credentials: "include",
  });

  if (!request.ok) {
    throw new Error("Failed to get login URL");
  }

  const response: LoginURLResponse = await request.json();
  if (!response.url) {
    throw new Error("Login URL was not returned");
  }

  return response.url;
};

const requestCallbackAccessToken = async (code: string) => {
  const searchParams = new URLSearchParams({ code });
  const request = await fetch(
    `${API_BASE_URL}/auth/discord/callback?${searchParams.toString()}`,
    { credentials: "include" },
  );

  if (!request.ok) {
    throw new Error("Failed to process Discord callback");
  }

  const response: AccessTokenResponse = await request.json();
  if (!response.access_token) {
    throw new Error("Access token was not returned");
  }

  useAuthStore.getState().setAccessToken(response.access_token);
  return response.access_token;
};

const authenticateWithCode = (code: string) => {
  if (!CALLBACK_REQUEST) {
    CALLBACK_REQUEST = requestCallbackAccessToken(code)
      .catch(async (error: unknown) => {
        await clearAuthSession();
        throw error;
      })
      .finally(() => {
        CALLBACK_REQUEST = null;
      });
  }

  return CALLBACK_REQUEST;
};

const requestAccessToken = async () => {
  const request = await fetch(`${API_BASE_URL}/auth/refresh`, {
    method: "POST",
    credentials: "include",
  });

  if (!request.ok) {
    throw new Error("Failed to refresh access token");
  }

  const response: AccessTokenResponse = await request.json();
  if (!response.access_token) {
    throw new Error("Access token was not returned");
  }

  useAuthStore.getState().setAccessToken(response.access_token);
  return response.access_token;
};

const refreshAccessToken = () => {
  if (!REFRESH_REQUEST) {
    REFRESH_REQUEST = requestAccessToken()
      .catch(async (error: unknown) => {
        await clearAuthSession();
        throw error;
      })
      .finally(() => {
        REFRESH_REQUEST = null;
      });
  }

  return REFRESH_REQUEST;
};

const logout = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/logout`, {
      method: "POST",
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error("Failed to log out");
    }
  } finally {
    await clearAuthSession();
  }
};

export {
  authenticateWithCode,
  clearAuthSession,
  getLoginUrl,
  logout,
  removeLegacyAuthStorage,
  refreshAccessToken,
};
