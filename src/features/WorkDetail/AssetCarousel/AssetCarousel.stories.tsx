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

export const Models: Story = {
  args: {
    assets: [
      createAsset(
        "asset-gltf",
        "model",
        "gltf",
        "https://threejs.org/examples/models/gltf/DamagedHelmet/glTF/DamagedHelmet.gltf",
      ),
      createAsset(
        "asset-fbx",
        "model",
        "fbx",
        "https://threejs.org/examples/models/fbx/Samba%20Dancing.fbx",
      ),
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

export const ManyAssets: Story = {
  args: {
    assets: Array.from({ length: 30 }, (_, index) =>
      createAsset(
        `asset-${index}`,
        "zip",
        "zip",
        `https://example.com/assets/${index}.zip`,
      ),
    ),
  },
  decorators: [
    (Story) => (
      <div style={{ width: 320, maxWidth: "100%" }}>
        <Story />
      </div>
    ),
  ],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const navigator = canvas.getByRole("navigation", {
      name: "アセットの一覧",
    });
    const initialPageScroll = window.scrollY;
    const expectSelectedVisible = (index: number) => {
      const thumbnail = canvas.getByRole("button", {
        name: `${index}番目のアセットを表示`,
      });
      expect(thumbnail).toHaveAttribute("aria-current", "true");
      const item = thumbnail.getBoundingClientRect();
      const viewport = navigator.getBoundingClientRect();
      expect(item.left).toBeGreaterThanOrEqual(viewport.left - 1);
      expect(item.right).toBeLessThanOrEqual(viewport.right + 1);
      expect(window.scrollY).toBe(initialPageScroll);
      const slides = canvasElement.querySelector(
        'li[data-active="true"]',
      )?.parentElement;
      expect(slides).not.toBeNull();
      if (slides)
        expect(
          Math.abs(slides.scrollLeft - (index - 1) * slides.clientWidth),
        ).toBeLessThanOrEqual(1);
    };
    await userEvent.click(
      canvas.getByRole("button", { name: "前のアセットを表示" }),
    );
    await waitFor(
      () => {
        expectSelectedVisible(30);
        expect(navigator.scrollLeft).toBe(
          navigator.scrollWidth - navigator.clientWidth,
        );
      },
      { timeout: 5000 },
    );
    await userEvent.click(
      canvas.getByRole("button", { name: "次のアセットを表示" }),
    );
    await waitFor(
      () => {
        expectSelectedVisible(1);
        expect(navigator.scrollLeft).toBe(0);
      },
      { timeout: 5000 },
    );
    for (let index = 2; index <= 8; index += 1) {
      await userEvent.click(
        canvas.getByRole("button", { name: "次のアセットを表示" }),
      );
      await waitFor(() => expectSelectedVisible(index), { timeout: 5000 });
    }
    await waitFor(() => {
      const item = canvas
        .getByRole("button", { name: "8番目のアセットを表示" })
        .getBoundingClientRect();
      const viewport = navigator.getBoundingClientRect();
      expect(
        Math.abs(
          item.left + item.width / 2 - viewport.left - viewport.width / 2,
        ),
      ).toBeLessThanOrEqual(1);
    });
  },
};
