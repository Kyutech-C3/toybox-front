const PENDING_LOGIN_KEY = "toybox-pending-login";
const LOGIN_CALLBACK_MAX_AGE_MS = 10 * 60 * 1000;

type PendingLogin = {
  startedAt: number;
  returnTo: string;
};

export type LoginCallback = {
  code: string | null;
  returnTo: string;
};

const getSafeReturnPath = (returnTo: unknown): string => {
  if (
    typeof returnTo !== "string" ||
    !returnTo.startsWith("/") ||
    returnTo.startsWith("//") ||
    Array.from(returnTo).some(
      (character) =>
        character === "\\" ||
        character.charCodeAt(0) <= 32 ||
        character.charCodeAt(0) === 127,
    )
  ) {
    return "/";
  }
  try {
    const url = new URL(returnTo, window.location.origin);
    if (
      url.origin !== window.location.origin ||
      url.pathname.startsWith("//") ||
      /^\/auth\/callback(?:\/|$)/.test(url.pathname)
    ) {
      return "/";
    }
    return url.pathname + url.search + url.hash;
  } catch {
    return "/";
  }
};

export const recordLoginCallback = (returnTo: string) => {
  const pendingLogin: PendingLogin = {
    startedAt: Date.now(),
    returnTo: getSafeReturnPath(returnTo),
  };
  sessionStorage.setItem(PENDING_LOGIN_KEY, JSON.stringify(pendingLogin));
};

export const consumeLoginCallback = (
  pathname: string,
  search: string,
): LoginCallback | null => {
  if (pathname !== "/auth/callback") return null;
  const searchParams = new URLSearchParams(search);

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
    return {
      code:
        codes.length === 1 && codes[0] && !searchParams.has("error")
          ? codes[0]
          : null,
      returnTo: getSafeReturnPath(
        "returnTo" in pendingLogin ? pendingLogin.returnTo : null,
      ),
    };
  } catch {
    return null;
  }
};
