import { useState } from "react";
import { expect, userEvent, within } from "storybook/test";

import AssetNavigator from "./index";

import type { Meta, StoryObj } from "@storybook/react";
import type { Asset } from "@/shared/types/work";

const toAsset = (
  id: string,
  assetType: string,
  extension: string,
  url: string,
): Asset => ({
  id,
  asset_type: assetType,
  extension,
  url,
  user_id: "user-1",
  work_id: "work-1",
  created_at: new Date("2026-09-20T00:00:00Z"),
  updated_at: "2026-09-20T00:00:00Z",
});

const ASSETS = [
  toAsset(
    "image",
    "image",
    "webp",
    new URL("/comingSoonHo-Oh.webp", window.location.origin).href,
  ),
  toAsset("video", "video", "mp4", "https://example.com/video.mp4"),
  toAsset("audio", "music", "wav", "https://example.com/audio.wav"),
  toAsset("model", "model", "gltf", "https://example.com/model.gltf"),
  toAsset("zip", "zip", "zip", "https://example.com/source.zip"),
];

const StatefulNavigator = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  return (
    <AssetNavigator
      assets={ASSETS}
      activeAssetIndex={activeIndex}
      failedAssetIDs={new Set()}
      onSelect={setActiveIndex}
    />
  );
};

const META = {
  title: "Features/WorkDetail/AssetNavigator",
  component: AssetNavigator,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
  args: {
    assets: ASSETS,
    activeAssetIndex: 0,
    failedAssetIDs: new Set(),
    onSelect: () => undefined,
  },
} satisfies Meta<typeof AssetNavigator>;

export default META;
type Story = StoryObj<typeof META>;

export const AssetTypes: Story = {
  render: () => <StatefulNavigator />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const third = canvas.getByRole("button", { name: "3番目のアセットを表示" });
    await userEvent.click(third);
    await expect(third).toHaveAttribute("aria-current", "true");
  },
};

export const FailedImage: Story = {
  args: { failedAssetIDs: new Set(["image"]) },
};
