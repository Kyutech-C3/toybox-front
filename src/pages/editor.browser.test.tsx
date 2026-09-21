import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { SWRConfig } from "swr";
import { describe, expect, it, vi } from "vitest";
import { page, userEvent } from "vitest/browser";

import EditPage from "./EditPage";

import { useAuthStore } from "@/features/auth/store/useAuthStore";
import ToastProvider from "@/shared/ui/Toast/ToastProvider";
import { createWork } from "@/test/fixtures";
import { render } from "@/test/render";

const setup = async (path: string, ownerID = "owner") => {
  useAuthStore.getState().startSession("token");
  const fetchMock = vi.fn<typeof fetch>().mockImplementation(async (input) => {
    const url = new URL(String(input));
    if (url.pathname === "/auth/users/me")
      return Response.json({ id: "owner", display_name: "作者", icon_url: "" });
    if (url.pathname === "/tags") return Response.json({ tags: [] });
    if (url.pathname === "/works/work-1")
      return Response.json(
        createWork({
          user: { id: ownerID, display_name: "作者", avatar_url: "" },
          thumbnail_url: "",
        }),
      );
    throw new Error(`Unexpected API: ${url.pathname}`);
  });
  vi.stubGlobal("fetch", fetchMock);
  const router = createMemoryRouter(
    [
      { path: "/edit/new", element: <EditPage isNewWork /> },
      { path: "/edit/:id", element: <EditPage /> },
      { path: "/", element: <h1>ホーム</h1> },
    ],
    { initialEntries: [path] },
  );
  const view = await render(
    <SWRConfig
      value={{
        suspense: true,
        shouldRetryOnError: false,
        revalidateOnFocus: false,
      }}
    >
      <ToastProvider>
        <RouterProvider router={router} />
      </ToastProvider>
    </SWRConfig>,
  );
  return { router, fetchMock, ...view };
};

describe("エディタ画面", () => {
  it("新規では既存作品を取得せず、説明の編集・preview・liveとEscapeが動作", async () => {
    const { fetchMock } = await setup("/edit/new");
    await expect
      .element(page.getByRole("heading", { name: "タイトル" }))
      .toBeVisible();
    expect(
      fetchMock.mock.calls.some(([url]) => String(url).includes("/works/")),
    ).toBe(false);
    const input = page.getByPlaceholder("Markdown で作品の説明を書けます");
    await input.fill("## プレビュー見出し\n\n本文");
    await page.getByRole("tab", { name: "プレビュー", exact: true }).click();
    await expect
      .element(page.getByRole("heading", { name: "プレビュー見出し" }))
      .toBeVisible();
    const overflow = document.body.style.overflow;
    await page.getByRole("tab", { name: "ライブ", exact: true }).click();
    await expect
      .element(page.getByRole("dialog", { name: "ライブモードの全画面表示" }))
      .toBeVisible();
    expect(document.body.style.overflow).toBe("hidden");
    await expect.element(input).toHaveFocus();
    await userEvent.keyboard("{Escape}");
    await expect.element(page.getByRole("dialog")).not.toBeInTheDocument();
    expect(document.body.style.overflow).toBe(overflow);
    await expect.element(input).toHaveValue("## プレビュー見出し\n\n本文");
  });
  it("他人の作品ではフォームを表示しない", async () => {
    await setup("/edit/work-1", "other");
    await expect
      .element(page.getByRole("heading", { name: "この作品は編集できません" }))
      .toBeVisible();
    await expect
      .element(page.getByRole("button", { name: "保存形式を選択" }))
      .not.toBeInTheDocument();
  });
  it("編集から新規への遷移でタイトル・本文を持ち越さない", async () => {
    const { router } = await setup("/edit/work-1");
    await expect
      .element(page.getByPlaceholder("Markdown で作品の説明を書けます"))
      .toHaveValue("作品の説明");
    vi.spyOn(window, "confirm").mockReturnValue(true);
    await router.navigate("/edit/new");
    await expect
      .element(page.getByPlaceholder("Markdown で作品の説明を書けます"))
      .toHaveValue("");
    await expect.element(page.getByRole("textbox").first()).toHaveValue("");
  });
  it("ライブからpreviewへ切り替えてもeditに戻されない", async () => {
    await setup("/edit/new");
    await page.getByPlaceholder("Markdown で作品の説明を書けます").fill("内容");
    await page.getByRole("tab", { name: "ライブ", exact: true }).click();
    await page
      .getByRole("dialog")
      .getByRole("tab", { name: "プレビュー", exact: true })
      .click();
    await expect.element(page.getByRole("dialog")).not.toBeInTheDocument();
    await expect
      .element(page.getByRole("tab", { name: "プレビュー", exact: true }))
      .toHaveAttribute("aria-selected", "true");
  });
});
