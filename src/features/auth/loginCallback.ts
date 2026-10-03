const PENDING_LOGIN_KEY = "toybox-pending-login";
const LOGIN_CALLBACK_MAX_AGE_MS = 10 * 60 * 1000;

type PendingLogin = {
  startedAt: number;
};

export type LoginCallback = {
  code: string;
};

export const recordLoginCallback = () => {
  const pendingLogin: PendingLogin = {
    startedAt: Date.now(),
  };
  sessionStorage.setItem(PENDING_LOGIN_KEY, JSON.stringify(pendingLogin));
};

export const consumeLoginCallback = (
  pathname: string,
  search: string,
): LoginCallback | null => {
  if (pathname !== "/auth/callback") return null;
  const searchParams = new URLSearchParams(search);
  if (!searchParams.has("code") && !searchParams.has("error")) return null;

  try {
    const storedLogin = sessionStorage.getItem(PENDING_LOGIN_KEY);
    if (!storedLogin) return null;
    const pendingLogin: unknown = JSON.parse(storedLogin);
    if (
      typeof pendingLogin !== "object" ||
      pendingLogin === null ||
      !("startedAt" in pendingLogin) ||
      typeof pendingLogin.startedAt !== "number" ||
      pendingLogin.startedAt > Date.now() ||
      Date.now() - pendingLogin.startedAt > LOGIN_CALLBACK_MAX_AGE_MS
    ) {
      sessionStorage.removeItem(PENDING_LOGIN_KEY);
      return null;
    }

    // 正規の戻り先への到着で一度だけ消費する。認可コードは保存しない。
    sessionStorage.removeItem(PENDING_LOGIN_KEY);
    const codes = searchParams.getAll("code");
    if (codes.length !== 1 || !codes[0] || searchParams.has("error")) {
      return null;
    }
    return { code: codes[0] };
  } catch {
    return null;
  }
};
