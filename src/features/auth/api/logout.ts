import { API_BASE_URL } from "@/util/apiConfig";

const LOGOUT_TIMEOUT_MS = 10_000;

const requestLogout = async (): Promise<void> => {
  const controller = new AbortController();
  const timeoutID = window.setTimeout(
    () => controller.abort(),
    LOGOUT_TIMEOUT_MS,
  );
  try {
    const response = await fetch(`${API_BASE_URL}/auth/logout`, {
      method: "POST",
      credentials: "include",
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error("Failed to log out");
    }
  } finally {
    window.clearTimeout(timeoutID);
  }
};

export default requestLogout;
