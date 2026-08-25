import { clearAuthSession, refreshAccessToken } from "@/features/auth/auth";
import { useAuthStore } from "@/features/auth/store/useAuthStore";
import { API_BASE_URL } from "@/util/apiConfig";

export class ApiError extends Error {
  status: number;

  constructor(status: number) {
    super(`Network response was not ok (${status})`);
    this.name = "ApiError";
    this.status = status;
  }
}

const throwResponseError = (response: Response): never => {
  throw new ApiError(response.status);
};

const fetchWithAuth = async (
  path: string,
  accessToken: string,
  init: RequestInit,
) => {
  const request = (token: string) =>
    fetch(`${API_BASE_URL}${path}`, {
      ...init,
      headers: {
        ...init.headers,
        Authorization: `Bearer ${token}`,
      },
    });

  let response = await request(accessToken);
  if (response.status !== 401) {
    return response;
  }

  const currentToken = useAuthStore.getState().accessToken;
  const retryToken =
    currentToken && currentToken !== accessToken
      ? currentToken
      : await refreshAccessToken();

  response = await request(retryToken);
  if (response.status === 401) {
    await clearAuthSession();
  }

  return response;
};

export const fetchData = async (path: string) => {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });
  if (!response.ok) {
    throwResponseError(response);
  }
  return response.json();
};

export const fetchDataWithAuth = async (path: string, accessToken: string) => {
  const response = await fetchWithAuth(path, accessToken, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });
  if (!response.ok) {
    throwResponseError(response);
  }
  return response.json();
};

export const postData = async (path: string, data: BodyInit) => {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: data,
  });
  if (!response.ok) {
    throw new Error("Network response was not ok");
  }
  return response.json();
};

export const patchDataWithAuth = async (
  path: string,
  data: BodyInit,
  accessToken: string,
) => {
  const response = await fetchWithAuth(path, accessToken, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: data,
  });
  if (!response.ok) {
    throw new Error("Network response was not ok");
  }
  return response.json();
};

export const postDataWithAuth = async (
  path: string,
  data: BodyInit,
  accessToken: string,
) => {
  const headers: HeadersInit = {
    Authorization: `Bearer ${accessToken}`,
  };

  if (!(data instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  const response = await fetchWithAuth(path, accessToken, {
    method: "POST",
    headers,
    body: data,
  });
  if (!response.ok) {
    throw new Error("Network response was not ok");
  }
  return response.json();
};
