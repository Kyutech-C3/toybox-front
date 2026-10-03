import { useRef } from "react";
import { expect, fireEvent, waitFor, within } from "storybook/test";

import useMediaPlayer from "./hook/useMediaPlayer";

import LoadingSpinner from "@/shared/ui/LoadingSpinner";

import type { Meta, StoryObj } from "@storybook/react";

const MediaLoadingExample = () => {
  const mediaRef = useRef<HTMLVideoElement>(null);
  const { isLoading } = useMediaPlayer({ mediaRef });

  return (
    <div>
      <video ref={mediaRef} preload="metadata" playsInline>
        <track kind="captions" />
      </video>
      {isLoading ? <LoadingSpinner /> : <p>再生待ち</p>}
    </div>
  );
};

const META = {
  title: "Features/WorkDetail/MediaPlayer/Loading",
  component: MediaLoadingExample,
} satisfies Meta<typeof MediaLoadingExample>;

export default META;
type Story = StoryObj<typeof META>;

export const DeferredPreload: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const media = canvasElement.querySelector("video");
    if (!media) throw new Error("動画要素がありません");

    const expectLoading = async (isLoading: boolean) => {
      await waitFor(() => {
        if (isLoading)
          expect(
            canvas.getByRole("status", { name: "読み込み中" }),
          ).toBeVisible();
        else
          expect(
            canvas.queryByRole("status", { name: "読み込み中" }),
          ).toBeNull();
      });
    };

    // 再生操作まで先読みされない場合も、読み込み中にはしない。
    await expectLoading(false);
    fireEvent(media, new Event("loadstart"));
    await expectLoading(true);
    fireEvent(media, new Event("suspend"));
    await expectLoading(false);

    fireEvent(media, new Event("loadstart"));
    fireEvent(media, new Event("loadedmetadata"));
    await expectLoading(false);

    // 再生中・シーク中の待機は、先読み停止でスピナーを消さない。
    Object.defineProperty(media, "paused", {
      configurable: true,
      value: false,
    });
    try {
      fireEvent(media, new Event("waiting"));
      await expectLoading(true);
      fireEvent(media, new Event("suspend"));
      await expectLoading(true);
      fireEvent(media, new Event("playing"));
      await expectLoading(false);
    } finally {
      Reflect.deleteProperty(media, "paused");
    }

    Object.defineProperty(media, "seeking", {
      configurable: true,
      value: true,
    });
    try {
      fireEvent(media, new Event("seeking"));
      await expectLoading(true);
      fireEvent(media, new Event("suspend"));
      await expectLoading(true);
      fireEvent(media, new Event("seeked"));
      await expectLoading(false);
    } finally {
      Reflect.deleteProperty(media, "seeking");
    }

    fireEvent(media, new Event("loadstart"));
    fireEvent(media, new Event("error"));
    await expectLoading(false);
  },
};
