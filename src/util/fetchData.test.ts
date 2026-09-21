import { beforeEach, describe, expect, it, vi } from "vitest";

import { API_BASE_URL } from "./apiConfig";
import {
  ApiError,
  deleteDataWithAuth,
  fetchData,
  fetchDataWithAuth,
  patchDataWithAuth,
  postData,
  postDataWithAuth,
  postDataWithAuthNoContent,
} from "./fetchData";

import {
  authenticateWithCode,
  clearAuthSession,
  getLoginUrl,
  logout,
  refreshAccessToken,
} from "@/features/auth/auth";
import { useAuthStore } from "@/features/auth/store/useAuthStore";
import { useUserStore } from "@/features/auth/store/useUserStore";
import { deferred } from "@/test/fixtures";

const FETCH = vi.fn<typeof fetch>();
const json = (value: unknown, status = 200) => Response.json(value, { status });

beforeEach(async () => {
  vi.stubGlobal("localStorage", { removeItem: vi.fn() });
  await clearAuthSession();
  FETCH.mockReset();
  vi.stubGlobal("fetch", FETCH);
  useAuthStore.getState().startSession("old-token");
});

describe("HTTP境界", () => {
  it("公開GETは認証を付けない", async () => {
    FETCH.mockResolvedValue(json({ data: 1 }));
    await expect(fetchData("/works")).resolves.toEqual({ data: 1 });
    expect(FETCH).toHaveBeenCalledWith(`${API_BASE_URL}/works`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });
  });
  it.each([
    [400, "リクエストの内容を確認してください"],
    [401, "ログインが必要です"],
    [403, "この操作を行う権限がありません"],
    [404, "データが見つかりません"],
    [409, "データを取得できませんでした"],
    [500, "サーバーで問題が発生しました"],
  ])("HTTP %iをApiErrorに変換", async (status, displayMessage) => {
    FETCH.mockResolvedValue(json({}, status));
    await expect(fetchData("/works")).rejects.toMatchObject({
      name: "ApiError",
      status,
      displayMessage,
    });
  });
  it("ネットワーク切断はstatus null", async () => {
    FETCH.mockRejectedValue(new TypeError("offline"));
    await expect(fetchData("/works")).rejects.toMatchObject({
      status: null,
      displayMessage: "サーバーに接続できませんでした",
    });
  });
  it("POSTとPATCHのJSON本文・認証を保持", async () => {
    FETCH.mockImplementation(async () => json({ id: "id" }));
    await postData("/public", '{"name":"public"}');
    await postDataWithAuth("/auth/works", '{"title":"test"}', "old-token");
    await patchDataWithAuth(
      "/auth/works/id",
      '{"title":"changed"}',
      "old-token",
    );
    expect(
      FETCH.mock.calls.map(([url, init]) => [
        url,
        init?.method,
        init?.body,
        init?.headers,
      ]),
    ).toEqual([
      [
        `${API_BASE_URL}/public`,
        "POST",
        '{"name":"public"}',
        { "Content-Type": "application/json" },
      ],
      [
        `${API_BASE_URL}/auth/works`,
        "POST",
        '{"title":"test"}',
        {
          "Content-Type": "application/json",
          Authorization: "Bearer old-token",
        },
      ],
      [
        `${API_BASE_URL}/auth/works/id`,
        "PATCH",
        '{"title":"changed"}',
        {
          "Content-Type": "application/json",
          Authorization: "Bearer old-token",
        },
      ],
    ]);
  });
  it("multipartのContent-Typeはブラウザに任せる", async () => {
    FETCH.mockResolvedValue(json({ id: "asset" }));
    const form = new FormData();
    form.append("file", new File(["data"], "a.png"));
    await postDataWithAuth("/upload", form, "old-token");
    expect(FETCH.mock.calls[0][1]).toMatchObject({
      body: form,
      headers: { Authorization: "Bearer old-token" },
    });
    expect(FETCH.mock.calls[0][1]?.headers).not.toHaveProperty("Content-Type");
  });
  it("204をJSONとして解析しない", async () => {
    FETCH.mockImplementation(async () => new Response(null, { status: 204 }));
    await expect(
      deleteDataWithAuth("/delete", "old-token"),
    ).resolves.toBeUndefined();
    await expect(
      postDataWithAuthNoContent("/favorite", "old-token"),
    ).resolves.toBeUndefined();
  });
  it("401でrefresh後に一度だけ再送する", async () => {
    FETCH.mockResolvedValueOnce(json({}, 401))
      .mockResolvedValueOnce(json({ access_token: "new-token" }))
      .mockResolvedValueOnce(json({ ok: true }));
    await expect(fetchDataWithAuth("/private", "old-token")).resolves.toEqual({
      ok: true,
    });
    expect(FETCH).toHaveBeenCalledTimes(3);
    expect(FETCH.mock.calls[1]).toEqual([
      `${API_BASE_URL}/auth/refresh`,
      { method: "POST", credentials: "include" },
    ]);
    expect(FETCH.mock.calls[2][1]?.headers).toHaveProperty(
      "Authorization",
      "Bearer new-token",
    );
  });
  it("別リクエストが更新済みのtokenを再利用する", async () => {
    useAuthStore.getState().setAccessToken("new-token");
    FETCH.mockResolvedValueOnce(json({}, 401)).mockResolvedValueOnce(
      json({ ok: true }),
    );
    await fetchDataWithAuth("/private", "old-token");
    expect(FETCH).toHaveBeenCalledTimes(2);
    expect(FETCH.mock.calls[1][1]?.headers).toHaveProperty(
      "Authorization",
      "Bearer new-token",
    );
  });
  it("再送も401ならセッションを破棄し無限再試行しない", async () => {
    FETCH.mockResolvedValueOnce(json({}, 401))
      .mockResolvedValueOnce(json({ access_token: "new-token" }))
      .mockResolvedValueOnce(json({}, 401));
    await expect(
      fetchDataWithAuth("/private", "old-token"),
    ).rejects.toBeInstanceOf(ApiError);
    expect(FETCH).toHaveBeenCalledTimes(3);
    expect(useAuthStore.getState().accessToken).toBeNull();
  });
  it("refresh失敗時は元リクエストを再送しない", async () => {
    FETCH.mockResolvedValueOnce(json({}, 401)).mockResolvedValueOnce(
      json({}, 401),
    );
    await expect(
      fetchDataWithAuth("/private", "old-token"),
    ).rejects.toMatchObject({ status: 401 });
    expect(FETCH).toHaveBeenCalledTimes(2);
  });
  it("応答待ちの間にログアウトしたら別セッションのtokenを使わない", async () => {
    const pending = deferred<Response>();
    FETCH.mockReturnValue(pending.promise);
    const request = fetchDataWithAuth("/private", "old-token");
    const assertion = expect(request).rejects.toMatchObject({ status: 401 });
    await clearAuthSession();
    useAuthStore.getState().startSession("other-user");
    pending.resolve(json({}, 401));
    await assertion;
    expect(FETCH).toHaveBeenCalledTimes(1);
    expect(useAuthStore.getState().accessToken).toBe("other-user");
  });
});

describe("認証セッション", () => {
  it("同時refreshを共有する", async () => {
    const pending = deferred<Response>();
    FETCH.mockReturnValue(pending.promise);
    const first = refreshAccessToken();
    const second = refreshAccessToken();
    expect(first).toBe(second);
    pending.resolve(json({ access_token: "fresh" }));
    await expect(first).resolves.toBe("fresh");
    expect(FETCH).toHaveBeenCalledTimes(1);
  });
  it("OAuth callbackを共有しcodeをURLエンコードする", async () => {
    FETCH.mockResolvedValue(json({ access_token: "callback-token" }));
    const first = authenticateWithCode("a&b +");
    const second = authenticateWithCode("a&b +");
    expect(first).toBe(second);
    await first;
    const url = new URL(String(FETCH.mock.calls[0][0]));
    expect(url.searchParams.get("code")).toBe("a&b +");
    expect(FETCH.mock.calls[0][1]).toEqual({ credentials: "include" });
    expect(useAuthStore.getState().accessToken).toBe("callback-token");
  });
  it.each([refreshAccessToken, () => authenticateWithCode("code")])(
    "古い認証応答でログアウトを取り消さない",
    async (authenticate) => {
      const pending = deferred<Response>();
      FETCH.mockReturnValue(pending.promise);
      const request = authenticate();
      const assertion = expect(request).rejects.toThrow("invalidated");
      await clearAuthSession();
      pending.resolve(json({ access_token: "stale" }));
      await assertion;
      expect(useAuthStore.getState().accessToken).toBeNull();
    },
  );
  it.each([{}, { access_token: "" }])(
    "tokenのない応答を拒否 %j",
    async (body) => {
      FETCH.mockResolvedValue(json(body));
      await expect(refreshAccessToken()).rejects.toThrow(
        "Access token was not returned",
      );
      expect(useAuthStore.getState().accessToken).toBeNull();
    },
  );
  it("ログアウトAPIが失敗してもローカルの認証とユーザーを消去", async () => {
    useUserStore
      .getState()
      .setUser({ id: "owner", display_name: "名前", icon_url: "" });
    FETCH.mockResolvedValue(json({}, 500));
    await expect(logout()).rejects.toThrow("Failed to log out");
    expect(useAuthStore.getState().accessToken).toBeNull();
    expect(useUserStore.getState().user).toBeNull();
    expect(localStorage.removeItem).toHaveBeenCalledWith("auth-storage");
    expect(localStorage.removeItem).toHaveBeenCalledWith("user-storage");
  });
  it("ログインURL取得と欠損応答", async () => {
    FETCH.mockResolvedValueOnce(json({ url: "https://example.com/oauth" }))
      .mockResolvedValueOnce(json({}))
      .mockResolvedValueOnce(json({}, 500));
    await expect(getLoginUrl()).resolves.toBe("https://example.com/oauth");
    await expect(getLoginUrl()).rejects.toThrow("Login URL was not returned");
    await expect(getLoginUrl()).rejects.toThrow("Failed to get login URL");
  });
});
