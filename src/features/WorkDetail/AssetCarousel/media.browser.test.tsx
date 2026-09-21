import { useRef } from "react";
import { flushSync } from "react-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import { page } from "vitest/browser";

import useAutoHideControls from "./MediaPlayer/hook/useAutoHideControls";
import useMediaPlayer from "./MediaPlayer/hook/useMediaPlayer";

import { render } from "@/test/render";

const MediaHarness = () => {
  const mediaRef = useRef<HTMLVideoElement>(null);
  const player = useMediaPlayer({ mediaRef });
  const controls = useAutoHideControls({ mediaRef });
  return (
    <>
      <video ref={mediaRef} aria-label="動画">
        <track kind="captions" />
      </video>
      <output aria-label="再生状態">{JSON.stringify(player)}</output>
      <output aria-label="操作表示">{String(controls.isVisible)}</output>
      <button type="button" onClick={player.togglePlay}>
        再生切替
      </button>
      <button type="button" onClick={() => player.seekTo(-10)}>
        先頭
      </button>
      <button type="button" onClick={() => player.seekTo(200)}>
        最後
      </button>
      <button type="button" onClick={() => player.seekBy(-10)}>
        戻る
      </button>
      <button type="button" onClick={() => player.changeVolume(-1)}>
        消音
      </button>
      <button type="button" onClick={() => player.changeVolume(2)}>
        最大音量
      </button>
      <button type="button" onClick={controls.pinControls}>
        固定
      </button>
      <button type="button" onClick={controls.unpinControls}>
        固定解除
      </button>
      <button type="button" onClick={controls.showControls}>
        表示
      </button>
    </>
  );
};

afterEach(() => vi.useRealTimers());

describe("メディア操作", () => {
  it("メタデータ・再生イベントを反映しシークと音量を範囲内に制限", async () => {
    const { container } = await render(<MediaHarness />);
    const media = container.querySelector("video");
    if (!media) throw new Error("missing video");
    vi.spyOn(media, "duration", "get").mockReturnValue(100);
    media.dispatchEvent(new Event("loadedmetadata"));
    await expect
      .element(page.getByRole("status", { name: "再生状態" }))
      .toHaveTextContent('"duration":100');
    await page.getByRole("button", { name: "最後", exact: true }).click();
    expect(media.currentTime).toBe(100);
    await page.getByRole("button", { name: "戻る", exact: true }).click();
    expect(media.currentTime).toBe(90);
    await page.getByRole("button", { name: "先頭", exact: true }).click();
    expect(media.currentTime).toBe(0);
    await page.getByRole("button", { name: "消音" }).click();
    expect(media.volume).toBe(0);
    expect(media.muted).toBe(true);
    await page.getByRole("button", { name: "最大音量" }).click();
    expect(media.volume).toBe(1);
    expect(media.muted).toBe(false);
    media.dispatchEvent(new Event("play"));
    await expect
      .element(page.getByRole("status", { name: "再生状態" }))
      .toHaveTextContent('"isPlaying":true');
    media.dispatchEvent(new Event("ended"));
    await expect
      .element(page.getByRole("status", { name: "再生状態" }))
      .toHaveTextContent('"isPlaying":false');
  });
  it("再生拒否を未処理例外にせず、無限長メディアをシークしない", async () => {
    const { container } = await render(<MediaHarness />);
    const media = container.querySelector("video");
    if (!media) throw new Error("missing video");
    const play = vi
      .spyOn(media, "play")
      .mockRejectedValue(new Error("autoplay blocked"));
    vi.spyOn(media, "duration", "get").mockReturnValue(
      Number.POSITIVE_INFINITY,
    );
    await page.getByRole("button", { name: "再生切替" }).click();
    expect(play).toHaveBeenCalledOnce();
    await page.getByRole("button", { name: "最後", exact: true }).click();
    expect(media.currentTime).toBe(0);
    vi.spyOn(media, "paused", "get").mockReturnValue(false);
    const pause = vi.spyOn(media, "pause").mockImplementation(() => {});
    await page.getByRole("button", { name: "再生切替" }).click();
    expect(pause).toHaveBeenCalledOnce();
  });
  it("操作UIは一定時間後に隠れ、固定中は隠れず解除後に隠れる", async () => {
    vi.useFakeTimers();
    const { container } = await render(<MediaHarness />);
    const advance = () => flushSync(() => vi.advanceTimersByTime(2000));
    advance();
    expect(
      container.querySelector('[aria-label="操作表示"]')?.textContent,
    ).toBe("false");
    const click = (label: string) => {
      const button = Array.from(container.querySelectorAll("button")).find(
        (element) => element.textContent === label,
      );
      if (!button) throw new Error(label);
      flushSync(() => button.click());
    };
    click("固定");
    advance();
    expect(
      container.querySelector('[aria-label="操作表示"]')?.textContent,
    ).toBe("true");
    click("固定解除");
    advance();
    expect(
      container.querySelector('[aria-label="操作表示"]')?.textContent,
    ).toBe("false");
    click("表示");
    expect(
      container.querySelector('[aria-label="操作表示"]')?.textContent,
    ).toBe("true");
  });
});
