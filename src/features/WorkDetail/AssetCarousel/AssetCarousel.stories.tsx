import { expect, userEvent, waitFor, within } from "storybook/test";

import AssetCarousel from "./index";

import type { Meta, StoryObj } from "@storybook/react";
import type { Asset } from "@/shared/types/work";

const META: Meta<typeof AssetCarousel> = {
  title: "Features/WorkDetail/AssetCarousel",
  component: AssetCarousel,
  parameters: {
    layout: "fullscreen",
  },
  tags: ["autodocs"],
};

export default META;
type Story = StoryObj<typeof META>;

const createAsset = (
  id: string,
  assetType: string,
  extension: string,
  url: string,
): Asset => ({
  id,
  asset_type: assetType,
  created_at: new Date("2026-08-30T00:00:00Z"),
  extension,
  updated_at: "2026-08-30T00:00:00Z",
  url,
  user_id: "user-1",
  work_id: "work-1",
});

export const WebPImage: Story = {
  args: {
    assets: [
      createAsset("asset-webp", "image", "webp", "/comingSoonHo-Oh.webp"),
    ],
  },
};

export const DownloadableAssets: Story = {
  args: {
    assets: [
      createAsset(
        "asset-zip",
        "zip",
        "zip",
        "https://example.com/assets/source.zip",
      ),
      createAsset(
        "asset-unknown",
        "future-format",
        "blend",
        "https://example.com/assets/model.blend",
      ),
    ],
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const firstIndicator = canvas.getByRole("button", {
      name: "1番目のアセットを表示",
    });
    const secondIndicator = canvas.getByRole("button", {
      name: "2番目のアセットを表示",
    });
    const previousButton = canvas.getByRole("button", {
      name: "前のアセットを表示",
    });
    const nextButton = canvas.getByRole("button", {
      name: "次のアセットを表示",
    });

    await expect(firstIndicator).toHaveAttribute("aria-current", "true");
    await userEvent.click(previousButton);
    await waitFor(() =>
      expect(secondIndicator).toHaveAttribute("aria-current", "true"),
    );
    await userEvent.click(nextButton);
    await waitFor(() =>
      expect(firstIndicator).toHaveAttribute("aria-current", "true"),
    );
  },
};
