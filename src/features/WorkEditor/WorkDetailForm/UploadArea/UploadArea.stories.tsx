import { expect, fireEvent, fn, userEvent, within } from "storybook/test";

import UploadArea from "./index";

import type { Meta, StoryObj } from "@storybook/react";
import type { CSSProperties } from "react";

const META = {
  title: "Features/WorkEditor/UploadArea",
  component: UploadArea,
  parameters: { layout: "centered" },
  decorators: [
    (Story) => (
      <div style={{ "--upload-cell-width": "140px" } as CSSProperties}>
        <Story />
      </div>
    ),
  ],
  args: {
    accept: "image/png",
    ariaLabel: "ファイルを追加",
    onSelectFiles: fn(),
  },
  tags: ["autodocs"],
} satisfies Meta<typeof UploadArea>;

export default META;
type Story = StoryObj<typeof META>;

export const Single: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByLabelText("ファイルを追加のファイル選択");
    const file = new File(["image"], "first.png", { type: "image/png" });
    await userEvent.upload(input, file);
    await expect(args.onSelectFiles).toHaveBeenCalledWith([file]);
    // 同じファイルを選び直しても受け付ける
    await userEvent.upload(input, file);
    await expect(args.onSelectFiles).toHaveBeenCalledTimes(2);

    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(file);
    dataTransfer.items.add(
      new File(["image"], "second.png", { type: "image/png" }),
    );
    await fireEvent.drop(canvas.getByRole("button"), { dataTransfer });
    await expect(args.onSelectFiles).toHaveBeenLastCalledWith([file]);
  },
};

export const Multiple: Story = {
  args: { isMultiple: true },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const files = ["first.png", "second.png"].map(
      (name) => new File(["image"], name, { type: "image/png" }),
    );
    await userEvent.upload(
      canvas.getByLabelText("ファイルを追加のファイル選択"),
      files,
    );
    await expect(args.onSelectFiles).toHaveBeenCalledWith(files);
    const dataTransfer = new DataTransfer();
    for (const file of files) dataTransfer.items.add(file);
    await fireEvent.drop(canvas.getByRole("button"), { dataTransfer });
    await expect(args.onSelectFiles).toHaveBeenLastCalledWith(files);
  },
};

export const Disabled: Story = {
  args: { isDisabled: true },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole("button");
    await expect(button).toBeDisabled();
    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(
      new File(["image"], "image.png", { type: "image/png" }),
    );
    await fireEvent.drop(button, { dataTransfer });
    await userEvent.upload(
      canvas.getByLabelText("ファイルを追加のファイル選択"),
      Array.from(dataTransfer.files),
    );
    await expect(args.onSelectFiles).not.toHaveBeenCalled();
  },
};
