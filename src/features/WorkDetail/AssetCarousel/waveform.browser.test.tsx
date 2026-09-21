import { describe, expect, it, vi } from "vitest";
import { page } from "vitest/browser";

import useAudioWaveform from "./AudioCard/hook/useAudioWaveform";

import { deferred } from "@/test/fixtures";
import { render } from "@/test/render";

const createWave = () => {
  const buffer = new ArrayBuffer(44 + 1600);
  const view = new DataView(buffer);
  const write = (offset: number, value: string) => {
    for (let index = 0; index < value.length; index++)
      view.setUint8(offset + index, value.charCodeAt(index));
  };
  write(0, "RIFF");
  view.setUint32(4, buffer.byteLength - 8, true);
  write(8, "WAVE");
  write(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, 8000, true);
  view.setUint32(28, 16000, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  write(36, "data");
  view.setUint32(40, 1600, true);
  for (let i = 0; i < 800; i++)
    view.setInt16(44 + i * 2, Math.round(Math.sin(i / 10) * 16000), true);
  return new Blob([buffer], { type: "audio/wav" });
};
type WaveformHarnessProps = { isEnabled?: boolean };
const WaveformHarness = ({ isEnabled = true }: WaveformHarnessProps) => {
  const waveform = useAudioWaveform({
    src: "https://audio.example/test.wav",
    barCount: 8,
    isEnabled,
  });
  return (
    <>
      <output aria-label="波形">{JSON.stringify(waveform.peaks)}</output>
      <output aria-label="再生URL">{waveform.playbackURL}</output>
    </>
  );
};

describe("音声波形", () => {
  it("実際のWAVをdecodeして正規化し、unmountでblobを解放", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response(createWave())),
    );
    const revoke = vi.spyOn(URL, "revokeObjectURL");
    const view = await render(<WaveformHarness />);
    await expect
      .element(page.getByRole("status", { name: "再生URL" }))
      .toHaveTextContent("blob:");
    await expect
      .poll(
        () =>
          JSON.parse(
            page.getByRole("status", { name: "波形" }).element().textContent ??
              "[]",
          ).length,
      )
      .toBe(8);
    const peaks: number[] = JSON.parse(
      page.getByRole("status", { name: "波形" }).element().textContent ?? "[]",
    );
    expect(Math.max(...peaks)).toBe(1);
    expect(peaks.every((peak) => peak >= 0 && peak <= 1)).toBe(true);
    const url = page
      .getByRole("status", { name: "再生URL" })
      .element().textContent;
    await view.rerender(null);
    expect(revoke).toHaveBeenCalledWith(url);
  });
  it("取得失敗は元URLでの再生へfallback", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response(null, { status: 500 })),
    );
    await render(<WaveformHarness />);
    await expect
      .element(page.getByRole("status", { name: "再生URL" }))
      .toHaveTextContent("https://audio.example/test.wav");
    await expect
      .element(page.getByRole("status", { name: "波形" }))
      .toHaveTextContent("[]");
  });
  it("無効時は取得せず、unmountで待機中requestを中止", async () => {
    const pending = deferred<Response>();
    const fetchMock = vi.fn<typeof fetch>().mockReturnValue(pending.promise);
    vi.stubGlobal("fetch", fetchMock);
    const view = await render(<WaveformHarness isEnabled={false} />);
    expect(fetchMock).not.toHaveBeenCalled();
    await view.rerender(<WaveformHarness />);
    await expect.poll(() => fetchMock.mock.calls.length).toBe(1);
    const signal = fetchMock.mock.calls[0][1]?.signal;
    await view.rerender(null);
    expect(signal?.aborted).toBe(true);
    pending.resolve(new Response(createWave()));
  });
});
