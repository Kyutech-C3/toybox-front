import { describe, expect, it, vi } from "vitest";
import { page, userEvent } from "vitest/browser";

import AudioCard from "./AudioCard";
import AssetCarousel from "./index";
import MediaPlayer from "./MediaPlayer";
import MovieCard from "./MovieCard";

import { render } from "@/test/render";

import type { Asset } from "@/shared/types/work";

const createAsset = (overrides: Partial<Asset> = {}): Asset => ({
  id: "image",
  asset_type: "image",
  extension: "webp",
  url: `${location.origin}/comingSoonHo-Oh.webp`,
  created_at: new Date(),
  updated_at: "",
  user_id: "owner",
  work_id: "work",
  ...overrides,
});

describe("メディア表示と操作", () => {
  it("画像の疑似全画面はEscapeとunmountでbodyスクロールを戻す", async () => {
    vi.spyOn(Element.prototype, "requestFullscreen").mockRejectedValue(
      new Error("unsupported"),
    );
    const overflow = document.body.style.overflow;
    const view = await render(<AssetCarousel assets={[createAsset()]} />);
    await page.getByRole("button", { name: "全画面表示", exact: true }).click();
    await expect
      .element(page.getByRole("button", { name: "全画面表示を終了" }))
      .toBeVisible();
    expect(document.body.style.overflow).toBe("hidden");
    await userEvent.keyboard("{Escape}");
    await expect
      .element(page.getByRole("button", { name: "全画面表示", exact: true }))
      .toBeVisible();
    expect(document.body.style.overflow).toBe(overflow);
    await page.getByRole("button", { name: "全画面表示", exact: true }).click();
    await expect
      .element(page.getByRole("button", { name: "全画面表示を終了" }))
      .toBeVisible();
    await view.rerender(null);
    expect(document.body.style.overflow).toBe(overflow);
  });
  it("画像読込失敗時にダウンロード表示へ切り替え、全画面操作を消す", async () => {
    const { container } = await render(
      <AssetCarousel assets={[createAsset()]} />,
    );
    const image = container.querySelector("img");
    image?.dispatchEvent(new Event("error"));
    await expect
      .element(page.getByRole("button", { name: "全画面表示", exact: true }))
      .not.toBeInTheDocument();
    await expect
      .element(page.getByRole("link", { name: /ダウンロード/ }))
      .toHaveAttribute("href", `${location.origin}/comingSoonHo-Oh.webp`);
  });
  it.each([
    [".MOV", ["video/mp4", "video/quicktime"]],
    ["webm", ["video/webm"]],
    ["avi", ["video/x-msvideo"]],
    ["flv", ["video/x-flv"]],
    ["unknown", ["video/mp4"]],
  ] as const)(
    "動画の拡張子 %s と読込失敗通知",
    async (extension, mimeTypes) => {
      const onLoadError = vi.fn();
      const { container } = await render(
        <MovieCard
          src={`${location.origin}/test-video.mp4`}
          extension={extension}
          isActive={false}
          onLoadError={onLoadError}
        />,
      );
      expect(
        Array.from(container.querySelectorAll("source")).map(
          (source) => source.type,
        ),
      ).toEqual(mimeTypes);
      expect(container.querySelector("video")?.preload).toBe("none");
      container.querySelector("video")?.dispatchEvent(new Event("error"));
      expect(onLoadError).toHaveBeenCalledOnce();
    },
  );
  it("非表示音声は取得せず、表示後は再生URLとダウンロード導線を提供", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response(null, { status: 500 }));
    vi.stubGlobal("fetch", fetchMock);
    const view = await render(
      <AudioCard src="https://audio.example/a.wav" isActive={false} />,
    );
    expect(fetchMock).not.toHaveBeenCalled();
    await view.rerender(
      <AudioCard src="https://audio.example/a.wav" isActive />,
    );
    await expect.poll(() => fetchMock.mock.calls.length).toBe(1);
    await expect
      .element(page.getByRole("link", { name: "音声ファイルをダウンロード" }))
      .toHaveAttribute("href", "https://audio.example/a.wav");
  });
  it("再生・音量・シーク・全画面のUI操作を通知", async () => {
    const onTogglePlay = vi.fn();
    const onChangeVolume = vi.fn();
    const onSeekRatio = vi.fn();
    const onToggleFullscreen = vi.fn();
    await render(
      <MediaPlayer
        isPlaying={false}
        currentTime={30}
        duration={90}
        volume={1}
        downloadLabel="ダウンロード"
        onTogglePlay={onTogglePlay}
        onChangeVolume={onChangeVolume}
        onSeekRatio={onSeekRatio}
        onToggleFullscreen={onToggleFullscreen}
      />,
    );
    await page.getByRole("button", { name: "再生", exact: true }).click();
    expect(onTogglePlay).toHaveBeenCalledOnce();
    await page.getByRole("button", { name: "ミュートにする" }).click();
    expect(onChangeVolume).toHaveBeenCalledWith(0);
    await page.getByRole("button", { name: "全画面表示にする" }).click();
    expect(onToggleFullscreen).toHaveBeenCalledOnce();
    const slider = page.getByRole("slider", { name: "再生位置" });
    await expect
      .element(slider)
      .toHaveAttribute("aria-valuetext", "0:30 / 1:30");
    (slider.element() as HTMLElement).focus();
    await userEvent.keyboard("{End}");
    expect(onSeekRatio).toHaveBeenCalledWith(1);
  });
});
