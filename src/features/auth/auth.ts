import { mutate } from "swr";

import requestLogout from "./api/logout";
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
let AUTH_REQUEST_GENERATION = 0;

const invalidateAuthRequests = () => {
  AUTH_REQUEST_GENERATION += 1;
  REFRESH_REQUEST = null;
  CALLBACK_REQUEST = null;
};

const assertAuthRequestIsCurrent = (generation: number) => {
  if (generation !== AUTH_REQUEST_GENERATION) {
    throw new Error("Authentication request was invalidated");
  }
};

const removeLegacyAuthStorage = () => {
  localStorage.removeItem("auth-storage");
  localStorage.removeItem("user-storage");
};

const clearAuthSession = async () => {
  invalidateAuthRequests();
  removeLegacyAuthStorage();
  useAuthStore.getState().clearAuth();
  useUserStore.getState().clearUser();
  await mutate((key) => Array.isArray(key), undefined, { revalidate: false });
  await mutate((key) => typeof key === "string", undefined, {
    revalidate: true,
  });
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

const requestCallbackAccessToken = async (code: string, generation: number) => {
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

  assertAuthRequestIsCurrent(generation);
  useAuthStore.getState().startSession(response.access_token);
  return response.access_token;
};

const authenticateWithCode = (code: string) => {
  if (!CALLBACK_REQUEST) {
    const generation = AUTH_REQUEST_GENERATION;
    const request = requestCallbackAccessToken(code, generation)
      .catch(async (error: unknown) => {
        if (generation === AUTH_REQUEST_GENERATION) {
          await clearAuthSession();
        }
        throw error;
      })
      .finally(() => {
        if (CALLBACK_REQUEST === request) CALLBACK_REQUEST = null;
      });
    CALLBACK_REQUEST = request;
  }

  return CALLBACK_REQUEST;
};

const requestAccessToken = async (generation: number) => {
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

  assertAuthRequestIsCurrent(generation);
  useAuthStore.getState().setAccessToken(response.access_token);
  return response.access_token;
};

const refreshAccessToken = () => {
  if (!REFRESH_REQUEST) {
    const generation = AUTH_REQUEST_GENERATION;
    const request = requestAccessToken(generation)
      .catch(async (error: unknown) => {
        if (generation === AUTH_REQUEST_GENERATION) {
          await clearAuthSession();
        }
        throw error;
      })
      .finally(() => {
        if (REFRESH_REQUEST === request) REFRESH_REQUEST = null;
      });
    REFRESH_REQUEST = request;
  }

  return REFRESH_REQUEST;
};

const logout = async () => {
  invalidateAuthRequests();
  let requestError: unknown;

  try {
    await requestLogout();
  } catch (error) {
    requestError = error;
  }

  try {
    await clearAuthSession();
  } catch (error) {
    console.error("Failed to clear authenticated cache:", error);
  }

  if (requestError) {
    throw requestError;
  }
};

export {
  authenticateWithCode,
  clearAuthSession,
  getLoginUrl,
  logout,
  refreshAccessToken,
  removeLegacyAuthStorage,
};
