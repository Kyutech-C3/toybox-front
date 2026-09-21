import { describe, expect, it, vi } from "vitest";
import { page } from "vitest/browser";

import { createWorkEditorStore } from "./store/createWorkEditorStore";
import WORK_EDITOR_STORE_CONTEXT from "./store/workEditorStoreContext";
import AssetUpload from "./WorkDetailForm/AssetUpload";
import useAssetUpload from "./WorkDetailForm/hook/useAssetUpload";
import useThumbnailUpload from "./WorkDetailForm/hook/useThumbnailUpload";

import { useAuthStore } from "@/features/auth/store/useAuthStore";
import { deferred } from "@/test/fixtures";
import { render } from "@/test/render";

const UploadHarness = () => {
  const assets = useAssetUpload();
  const thumbnail = useThumbnailUpload();
  return (
    <>
      <label>
        添付
        <input
          type="file"
          multiple
          onChange={(event) =>
            assets.handleAddFiles(Array.from(event.target.files ?? []))
          }
        />
      </label>
      <label>
        サムネイル
        <input
          type="file"
          onChange={(event) =>
            thumbnail.handleSelectFile(event.target.files?.[0] ?? null)
          }
        />
      </label>
      <p>
        {assets.validationError}
        {thumbnail.validationError}
      </p>
      <button type="button" onClick={thumbnail.handleRetry}>
        画像再試行
      </button>
      <button type="button" onClick={thumbnail.handleRemove}>
        画像削除
      </button>
      {assets.assets.map((asset) => (
        <div key={asset.key}>
          <span>{asset.status}</span>
          <button type="button" onClick={() => assets.handleRetry(asset.key)}>
            再試行
          </button>
          <button type="button" onClick={() => assets.handleRemove(asset.key)}>
            削除
          </button>
        </div>
      ))}
    </>
  );
};
const setup = async () => {
  useAuthStore.getState().startSession("token");
  const store = createWorkEditorStore();
  store.getState().initializeForNew();
  const view = await render(
    <WORK_EDITOR_STORE_CONTEXT.Provider value={store}>
      <UploadHarness />
    </WORK_EDITOR_STORE_CONTEXT.Provider>,
  );
  return { store, ...view };
};

describe("アップロード", () => {
  it("形式とサイズを検証して不正なファイルを送信しない", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    await setup();
    await page
      .getByLabelText("添付", { exact: true })
      .upload(new File(["x"], "script.exe"));
    await expect
      .element(page.getByText("script.exe は対応していない形式です"))
      .toBeVisible();
    await page
      .getByLabelText("サムネイル", { exact: true })
      .upload(new File(["x"], "movie.mp4"));
    await expect
      .element(page.getByText(/対応していない画像形式です/))
      .toBeVisible();
    await page
      .getByLabelText("サムネイル", { exact: true })
      .upload(new File([new Uint8Array(5 * 1024 * 1024 + 1)], "large.png"));
    await expect
      .element(page.getByText(/ファイルサイズは5MB以下/))
      .toBeVisible();
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it("失敗後に再試行して同じファイルを保存し重複を防ぐ", async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(Response.json({}, { status: 500 }))
      .mockResolvedValueOnce(
        Response.json({ id: "uploaded", url: "https://example.com/a.png" }),
      );
    vi.stubGlobal("fetch", fetchMock);
    const { store } = await setup();
    const file = new File(["x"], "photo.png", { lastModified: 1 });
    // Playwrightのファイル転送はlastModifiedを再生成するため、同一Fileを維持してchangeを発火する。
    const input = page
      .getByLabelText("添付", { exact: true })
      .element() as HTMLInputElement;
    const transfer = new DataTransfer();
    transfer.items.add(file);
    transfer.items.add(file);
    input.files = transfer.files;
    input.dispatchEvent(new Event("change", { bubbles: true }));
    await expect
      .poll(() => store.getState().current.assets[0]?.status)
      .toBe("error");
    expect(store.getState().current.assets).toHaveLength(1);
    await page.getByRole("button", { name: "再試行", exact: true }).click();
    await expect
      .poll(() => store.getState().current.assets[0]?.assetID)
      .toBe("uploaded");
    expect(store.getState().uploadedAssetIDs).toEqual(["uploaded"]);
    const form = fetchMock.mock.calls[1][1]?.body;
    expect(form).toBeInstanceOf(FormData);
    expect((form as FormData).get("file")).toBeInstanceOf(File);
    await page.getByRole("button", { name: "削除", exact: true }).click();
    expect(store.getState().current.assets).toEqual([]);
  });
  it("サムネイルの失敗を再試行できる", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn<typeof fetch>()
        .mockResolvedValueOnce(Response.json({}, { status: 500 }))
        .mockResolvedValueOnce(
          Response.json({ id: "thumb", url: "https://example.com/a.png" }),
        ),
    );
    const { store } = await setup();
    await page
      .getByLabelText("サムネイル", { exact: true })
      .upload(new File(["x"], "photo.png"));
    await expect
      .poll(() => store.getState().current.thumbnail?.status)
      .toBe("error");
    await page.getByRole("button", { name: "画像再試行" }).click();
    await expect
      .poll(() => store.getState().current.thumbnail?.assetID)
      .toBe("thumb");
    await page.getByRole("button", { name: "画像削除" }).click();
    expect(store.getState().current.thumbnail).toBeNull();
  });
  it.each(["添付", "サムネイル"])(
    "reset後の古い%s完了を新しい編集セッションへ書き込まない",
    async (label) => {
      const pending = deferred<Response>();
      vi.stubGlobal(
        "fetch",
        vi.fn<typeof fetch>().mockReturnValue(pending.promise),
      );
      const { store } = await setup();
      await page
        .getByLabelText(label, { exact: true })
        .upload(new File(["x"], "photo.png"));
      store.getState().resetEditor();
      store.getState().initializeForNew();
      const response = Response.json({});
      const readBody = vi.spyOn(response, "json").mockResolvedValue({
        id: "stale",
        url: "https://example.com/stale.png",
      });
      pending.resolve(response);
      // 完了処理まで待った後に、IDが次のセッションへ混入していないことを確認する。
      await expect.poll(() => readBody.mock.calls.length).toBe(1);
      await page.getByRole("button", { name: "画像削除" }).click();
      expect(store.getState().uploadedAssetIDs).toEqual([]);
      expect(store.getState().current.thumbnail).toBeNull();
      expect(store.getState().current.assets).toEqual([]);
    },
  );
  it.each(["添付", "サムネイル"])(
    "unmount後の%s完了はstoreを書き換えず孤立アセットを削除",
    async (label) => {
      const pending = deferred<Response>();
      const fetchMock = vi
        .fn<typeof fetch>()
        .mockImplementation(async (_url, init) =>
          init?.method === "DELETE"
            ? new Response(null, { status: 204 })
            : pending.promise,
        );
      vi.stubGlobal("fetch", fetchMock);
      const { store, rerender } = await setup();
      await page
        .getByLabelText(label, { exact: true })
        .upload(new File(["x"], "photo.png"));
      await rerender(null);
      pending.resolve(
        Response.json({ id: "orphan", url: "https://example.com/a.png" }),
      );
      await expect
        .poll(() =>
          fetchMock.mock.calls.some(
            ([url, init]) =>
              String(url).endsWith("/auth/works/asset/orphan") &&
              init?.method === "DELETE",
          ),
        )
        .toBe(true);
      expect(store.getState().uploadedAssetIDs).toEqual([]);
    },
  );
  it("サムネイルの古い応答は新しく選んだ画像を上書きしない", async () => {
    const first = deferred<Response>();
    const second = deferred<Response>();
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockReturnValueOnce(first.promise)
      .mockReturnValueOnce(second.promise)
      .mockResolvedValue(new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", fetchMock);
    const { store } = await setup();
    const input = page.getByLabelText("サムネイル", { exact: true });
    await input.upload(new File(["a"], "first.png"));
    await input.upload(new File(["b"], "second.png"));
    second.resolve(
      Response.json({ id: "second", url: "https://example.com/second.png" }),
    );
    await expect
      .poll(() => store.getState().current.thumbnail?.assetID)
      .toBe("second");
    first.resolve(
      Response.json({ id: "first", url: "https://example.com/first.png" }),
    );
    await expect.poll(() => fetchMock.mock.calls.length).toBe(3);
    expect(store.getState().current.thumbnail?.assetID).toBe("second");
    expect(store.getState().uploadedAssetIDs).toEqual(["second"]);
  });
  it("認証が変わった後の完了を登録せず古いtokenで削除も送らない", async () => {
    const pending = deferred<Response>();
    const fetchMock = vi.fn<typeof fetch>().mockReturnValue(pending.promise);
    vi.stubGlobal("fetch", fetchMock);
    const { store } = await setup();
    await page
      .getByLabelText("添付", { exact: true })
      .upload(new File(["x"], "photo.png"));
    useAuthStore.getState().clearAuth();
    const response = Response.json({});
    const readBody = vi
      .spyOn(response, "json")
      .mockResolvedValue({ id: "stale", url: "https://example.com/a.png" });
    pending.resolve(response);
    await expect.poll(() => readBody.mock.calls.length).toBe(1);
    await page.getByRole("button", { name: "画像削除" }).click();
    expect(store.getState().uploadedAssetIDs).toEqual([]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
  it("実際の添付UIでdrop・エラー表示・再試行・削除が動作", async () => {
    useAuthStore.getState().startSession("token");
    const store = createWorkEditorStore();
    store.getState().initializeForNew();
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(Response.json({}, { status: 500 }))
      .mockResolvedValueOnce(
        Response.json({
          id: "uploaded",
          url: "https://example.com/source.zip",
        }),
      );
    vi.stubGlobal("fetch", fetchMock);
    await render(
      <WORK_EDITOR_STORE_CONTEXT.Provider value={store}>
        <AssetUpload />
      </WORK_EDITOR_STORE_CONTEXT.Provider>,
    );
    const transfer = new DataTransfer();
    transfer.items.add(new File(["zip"], "source.zip"));
    const target = page
      .getByRole("button", { name: "アセットを追加" })
      .element();
    target.dispatchEvent(
      new DragEvent("dragover", {
        bubbles: true,
        cancelable: true,
        dataTransfer: transfer,
      }),
    );
    target.dispatchEvent(
      new DragEvent("drop", {
        bubbles: true,
        cancelable: true,
        dataTransfer: transfer,
      }),
    );
    await expect
      .element(page.getByRole("alert"))
      .toHaveTextContent("アップロードに失敗しました");
    await page
      .getByRole("button", { name: "source.zipを再アップロード" })
      .click();
    await expect.element(page.getByText("ZIP・アップロード完了")).toBeVisible();
    await page.getByRole("button", { name: "source.zipを削除" }).click();
    await expect
      .element(page.getByText("source.zip", { exact: true }))
      .not.toBeInTheDocument();
    expect(store.getState().current.assets).toEqual([]);
  });
});
