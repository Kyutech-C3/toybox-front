import { describe, expect, it, vi } from "vitest";
import { page } from "vitest/browser";

import ProfileEditor from "./ProfileEditor";

import { useAuthStore } from "@/features/auth/store/useAuthStore";
import { useUserStore } from "@/features/auth/store/useUserStore";
import { render, TestProviders } from "@/test/render";

const PROFILE = {
  id: "owner",
  display_name: "作者",
  profile: "自己紹介",
  avatar_url: "",
  github_id: "",
  twitter_id: "",
};
const setup = async () => {
  useAuthStore.getState().startSession("token");
  useUserStore
    .getState()
    .setUser({ id: "owner", display_name: "作者", icon_url: "" });
  const onClose = vi.fn();
  await render(
    <TestProviders>
      <ProfileEditor
        userProfile={PROFILE}
        userPortfolioSWRKey={[
          "/users/owner",
          "/works/users/owner?page=1&limit=30",
          "token",
        ]}
        onClose={onClose}
      />
    </TestProviders>,
  );
  return onClose;
};

describe("プロフィール編集", () => {
  it.each(["--bad", "trailing-", "https://github.com/name", "a".repeat(40)])(
    "GitHubの不正IDを保存させない %s",
    async (input) => {
      const fetchMock = vi.fn();
      vi.stubGlobal("fetch", fetchMock);
      await setup();
      await page
        .getByRole("textbox", { name: "GitHub", exact: true })
        .fill(input);
      await expect
        .element(page.getByRole("button", { name: "保存", exact: true }))
        .toBeDisabled();
      await expect.element(page.getByRole("alert")).toBeVisible();
      expect(fetchMock).not.toHaveBeenCalled();
    },
  );
  it.each(["bad-name", "a".repeat(16)])(
    "Xの不正IDを保存させない %s",
    async (input) => {
      await setup();
      await page.getByRole("textbox", { name: "X", exact: true }).fill(input);
      await expect
        .element(page.getByRole("button", { name: "保存", exact: true }))
        .toBeDisabled();
    },
  );
  it("全角・@・周囲空白を正規化して保存しヘッダーの名前も更新", async () => {
    const fetchMock = vi.fn().mockResolvedValue(Response.json(PROFILE));
    vi.stubGlobal("fetch", fetchMock);
    const onClose = await setup();
    await page.getByRole("textbox", { name: "表示名" }).fill(" 新しい名前 ");
    await page
      .getByRole("textbox", { name: "GitHub", exact: true })
      .fill(" ＠ｇｉｔ－ｎａｍｅ ");
    await page
      .getByRole("textbox", { name: "X", exact: true })
      .fill(" @x_name ");
    await page.getByRole("button", { name: "保存", exact: true }).click();
    await expect.poll(() => onClose.mock.calls.length).toBe(1);
    expect(JSON.parse(String(fetchMock.mock.calls[0][1].body))).toEqual({
      display_name: "新しい名前",
      profile: "自己紹介",
      github_id: "git-name",
      twitter_id: "x_name",
    });
    expect(useUserStore.getState().user?.display_name).toBe("新しい名前");
  });
  it("空の表示名を拒否し失敗時は変更を残す", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(Response.json({}, { status: 500 })),
    );
    const onClose = await setup();
    const input = page.getByRole("textbox", { name: "表示名" });
    await input.fill("  ");
    await expect
      .element(page.getByRole("button", { name: "保存", exact: true }))
      .toBeDisabled();
    await input.fill("未保存");
    await page.getByRole("button", { name: "保存", exact: true }).click();
    await expect
      .element(page.getByRole("alert"))
      .toHaveTextContent("プロフィールを更新できませんでした");
    await expect.element(input).toHaveValue("未保存");
    expect(onClose).not.toHaveBeenCalled();
  });
  it("未変更なら確認せず閉じ、変更後は破棄確認に従う", async () => {
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(false);
    const onClose = await setup();
    await page.getByRole("button", { name: "キャンセル" }).click();
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(confirm).not.toHaveBeenCalled();
    await page.getByRole("textbox", { name: "表示名" }).fill("変更");
    await page.getByRole("button", { name: "キャンセル" }).click();
    expect(onClose).toHaveBeenCalledTimes(1);
    confirm.mockReturnValue(true);
    await page.getByRole("button", { name: "キャンセル" }).click();
    expect(onClose).toHaveBeenCalledTimes(2);
  });
});
