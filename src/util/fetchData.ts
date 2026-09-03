import { clearAuthSession, refreshAccessToken } from "@/features/auth/auth";
import { useAuthStore } from "@/features/auth/store/useAuthStore";
import { API_BASE_URL } from "@/util/apiConfig";

export class ApiError extends Error {
  status: number | null;
  displayMessage: string;

  constructor(
    status: number | null,
    displayMessage = getApiErrorMessage(status),
  ) {
    super(displayMessage);
    this.name = "ApiError";
    this.status = status;
    this.displayMessage = displayMessage;
  }
}

const getApiErrorMessage = (status: number | null): string => {
  if (status === null) {
    return "サーバーに接続できませんでした";
  }
  if (status === 400) {
    return "リクエストの内容を確認してください";
  }
  if (status === 401) {
    return "ログインが必要です";
  }
  if (status === 403) {
    return "この操作を行う権限がありません";
  }
  if (status === 404) {
    return "データが見つかりません";
  }
  if (status >= 500) {
    return "サーバーで問題が発生しました";
  }

  return "データを取得できませんでした";
};

const requestWithNetworkError = async (
  path: string,
  init: RequestInit,
): Promise<Response> => {
  try {
    return await fetch(`${API_BASE_URL}${path}`, init);
  } catch {
    throw new ApiError(null);
  }
};

const throwResponseError = (response: Response): never => {
  throw new ApiError(response.status);
};

const fetchWithAuth = async (
  path: string,
  accessToken: string,
  init: RequestInit,
) => {
  const request = (token: string) =>
    requestWithNetworkError(path, {
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
  let retryToken: string;
  try {
    retryToken =
      currentToken && currentToken !== accessToken
        ? currentToken
        : await refreshAccessToken();
  } catch {
    throw new ApiError(401);
  }

  response = await request(retryToken);
  if (response.status === 401) {
    await clearAuthSession();
  }

  return response;
};

export const fetchData = async (path: string) => {
  const response = await requestWithNetworkError(path, {
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
  const response = await requestWithNetworkError(path, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: data,
  });
  if (!response.ok) {
    throwResponseError(response);
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
    throwResponseError(response);
  }
  return response.json();
};

export const putDataWithAuth = async (
  path: string,
  data: BodyInit,
  accessToken: string,
) => {
  const response = await fetchWithAuth(path, accessToken, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: data,
  });
  if (!response.ok) {
    throwResponseError(response);
  }
  return response.json();
};

export const deleteDataWithAuth = async (
  path: string,
  accessToken: string,
): Promise<void> => {
  const response = await fetchWithAuth(path, accessToken, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
  });
  if (!response.ok) {
    throwResponseError(response);
  }
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
    throwResponseError(response);
  }
  return response.json();
};

export const postDataWithAuthNoContent = async (
  path: string,
  accessToken: string,
): Promise<void> => {
  const response = await fetchWithAuth(path, accessToken, {
    method: "POST",
  });
  if (!response.ok) {
    throwResponseError(response);
  }
};
