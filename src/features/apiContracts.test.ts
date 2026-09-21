import { beforeEach, describe, expect, it, vi } from "vitest";

import { useAuthStore } from "./auth/store/useAuthStore";
import postComment from "./CommentSection/api/postComment";
import {
  createFavorite,
  deleteFavorite,
  getFavoriteCount,
  getFavoriteStatus,
} from "./FavoriteButton/api/favorite";
import { getUserData } from "./Header/api/getUserData";
import { getUserProfile } from "./UserPortfolio/api/getUserProfile";
import { getUserWorks } from "./UserPortfolio/api/getUserWorks";
import { updateUserProfile } from "./UserPortfolio/api/updateUserProfile";
import { deleteWork } from "./WorkDelete/api/deleteWork";
import { createTag } from "./WorkEditor/api/createTag";
import { deletePendingResources } from "./WorkEditor/api/deletePendingResources";
import { getWork } from "./WorkEditor/api/getWork";
import { postWork } from "./WorkEditor/api/postWork";
import { updateWork } from "./WorkEditor/api/updateWork";
import { uploadAsset } from "./WorkEditor/api/uploadAsset";

import { API_BASE_URL } from "@/util/apiConfig";

const FETCH = vi.fn<typeof fetch>();
beforeEach(() => {
  FETCH.mockReset().mockImplementation(async () =>
    Response.json({ id: "response" }),
  );
  vi.stubGlobal("fetch", FETCH);
  useAuthStore.getState().startSession("token");
});

describe("APIのパス・method・wire形式", () => {
  it.each([false, true])("作品取得（認証 %s）", async (hasAuth) => {
    await getWork("work", hasAuth ? "token" : undefined);
    expect(FETCH.mock.calls[0][0]).toBe(`${API_BASE_URL}/works/work`);
    expect(FETCH.mock.calls[0][1]?.headers).toEqual(
      hasAuth
        ? { "Content-Type": "application/json", Authorization: "Bearer token" }
        : { "Content-Type": "application/json" },
    );
  });
  it.each([false, true])(
    "ユーザー作品のpage/limitと認証 %s",
    async (hasAuth) => {
      await getUserWorks({
        userID: "user",
        page: 2,
        limit: 30,
        accessToken: hasAuth ? "token" : undefined,
      });
      expect(FETCH.mock.calls[0][0]).toBe(
        `${API_BASE_URL}/works/users/user?page=2&limit=30`,
      );
      expect(FETCH.mock.calls[0][1]?.method).toBe("GET");
      expect(FETCH.mock.calls[0][1]?.headers).toHaveProperty(
        "Content-Type",
        "application/json",
      );
    },
  );
  it("profileの読み書きはAPIのsnake_caseを維持", async () => {
    await getUserProfile("user");
    await updateUserProfile({
      displayName: "名前",
      profile: "説明",
      xUsername: "x_name",
      githubUsername: "git-name",
      accessToken: "token",
    });
    expect(FETCH.mock.calls[0][0]).toBe(`${API_BASE_URL}/users/user`);
    expect(FETCH.mock.calls[1][0]).toBe(`${API_BASE_URL}/auth/users`);
    expect(FETCH.mock.calls[1][1]?.method).toBe("PATCH");
    expect(JSON.parse(String(FETCH.mock.calls[1][1]?.body))).toEqual({
      display_name: "名前",
      profile: "説明",
      twitter_id: "x_name",
      github_id: "git-name",
    });
  });
  it.each([undefined, "parent"])("コメント返信先 %s", async (replyAt) => {
    await postComment("work", "本文", "token", replyAt);
    expect(FETCH.mock.calls[0][0]).toBe(`${API_BASE_URL}/works/work/comments`);
    expect(JSON.parse(String(FETCH.mock.calls[0][1]?.body))).toEqual(
      replyAt ? { content: "本文", reply_at: replyAt } : { content: "本文" },
    );
  });
  it.each([false, true])(
    "favoriteのsnake_caseを境界で変換 %s",
    async (isFavorite) => {
      FETCH.mockResolvedValueOnce(Response.json({ is_favorite: isFavorite }));
      await expect(getFavoriteStatus("work", "token")).resolves.toEqual({
        isFavorite,
      });
      expect(FETCH.mock.calls[0][0]).toBe(
        `${API_BASE_URL}/auth/works/work/favorite/is-favorite`,
      );
    },
  );
  it("favoriteの件数・作成・取消", async () => {
    FETCH.mockResolvedValueOnce(Response.json({ total: 4 }))
      .mockResolvedValueOnce(new Response(null, { status: 204 }))
      .mockResolvedValueOnce(new Response(null, { status: 204 }));
    await expect(getFavoriteCount("work")).resolves.toEqual({ total: 4 });
    await createFavorite("work", "token");
    await deleteFavorite("work", "token");
    expect(FETCH.mock.calls.map(([url, init]) => [url, init?.method])).toEqual([
      [`${API_BASE_URL}/works/work/favorite`, "GET"],
      [`${API_BASE_URL}/auth/works/work/favorite`, "POST"],
      [`${API_BASE_URL}/auth/works/work/favorite`, "DELETE"],
    ]);
  });
  it("作品の投稿・部分更新・削除", async () => {
    const payload = {
      title: "作品",
      description: "",
      visibility: "draft" as const,
      asset_ids: [],
      tag_ids: [],
      thumbnail_asset_id: "thumb",
      urls: [],
    };
    await postWork(payload, "token");
    await updateWork("work", { urls: [] }, "token");
    await deleteWork("work", "token");
    expect(FETCH.mock.calls.map(([url, init]) => [url, init?.method])).toEqual([
      [`${API_BASE_URL}/auth/works`, "POST"],
      [`${API_BASE_URL}/auth/works/work`, "PATCH"],
      [`${API_BASE_URL}/auth/works/work`, "DELETE"],
    ]);
    expect(JSON.parse(String(FETCH.mock.calls[0][1]?.body))).toEqual(payload);
    expect(JSON.parse(String(FETCH.mock.calls[1][1]?.body))).toEqual({
      urls: [],
    });
  });
  it("uploadはfileというmultipartフィールドを使う", async () => {
    const file = new File(["data"], "a.png");
    await uploadAsset(file, "token");
    expect(FETCH.mock.calls[0][0]).toBe(`${API_BASE_URL}/auth/works/asset`);
    const form = FETCH.mock.calls[0][1]?.body;
    expect(form).toBeInstanceOf(FormData);
    expect((form as FormData).get("file")).toBe(file);
  });
  it("タグ作成のid欠損を検出", async () => {
    FETCH.mockResolvedValueOnce(
      Response.json({ id: "tag", name: "タグ" }),
    ).mockResolvedValueOnce(Response.json({}));
    await expect(createTag("タグ", "token")).resolves.toMatchObject({
      id: "tag",
    });
    await expect(createTag("タグ", "token")).rejects.toThrow(
      "Failed to create tag",
    );
    expect(JSON.parse(String(FETCH.mock.calls[0][1]?.body))).toEqual({
      name: "タグ",
    });
  });
  it("孤立リソースは一件失敗しても残りを全て削除する", async () => {
    FETCH.mockRejectedValueOnce(new Error("offline"));
    await expect(
      deletePendingResources({ assetIDs: ["a", "b"], tagIDs: ["t"] }, "token"),
    ).resolves.toBeUndefined();
    expect(FETCH.mock.calls.map(([url]) => url)).toEqual([
      `${API_BASE_URL}/auth/works/asset/a`,
      `${API_BASE_URL}/auth/works/asset/b`,
      `${API_BASE_URL}/auth/tags/t`,
    ]);
  });
  it("ログインユーザー取得の失敗はnull", async () => {
    FETCH.mockResolvedValueOnce(
      Response.json({ id: "user", display_name: "名前", icon_url: "" }),
    ).mockResolvedValueOnce(Response.json({}, { status: 500 }));
    await expect(getUserData("token")).resolves.toMatchObject({ id: "user" });
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    await expect(getUserData("token")).resolves.toBeNull();
    expect(error).toHaveBeenCalledOnce();
  });
});
