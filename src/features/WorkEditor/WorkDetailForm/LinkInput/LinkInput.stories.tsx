import { useState } from "react";
import { expect, userEvent, within } from "storybook/test";

import LinkInput from "./index";

import type { Meta, StoryObj } from "@storybook/react";

const META: Meta<typeof LinkInput> = {
  title: "Features/WorkEditor/LinkInput",
  component: LinkInput,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
};

export default META;
type Story = StoryObj<typeof META>;

type LinkInputStoryProps = {
  initialUrls: string[];
};

const LinkInputStory = ({ initialUrls }: LinkInputStoryProps) => {
  const [urls, setUrls] = useState(initialUrls);

  return (
    <div style={{ width: "min(900px, 90vw)" }}>
      <LinkInput urls={urls} onChangeUrls={setUrls} />
    </div>
  );
};

export const Empty: Story = {
  args: {
    urls: [],
    onChangeUrls: () => undefined,
  },
  render: () => <LinkInputStory initialUrls={[]} />,
};

export const ExistingUrls: Story = {
  args: {
    urls: [],
    onChangeUrls: () => undefined,
  },
  render: () => (
    <LinkInputStory
      initialUrls={[
        "https://toybox.compositecomputer.club/",
        "https://github.com/Kyutech-C3/toybox-front",
      ]}
    />
  ),
};

export const MaximumUrls: Story = {
  args: {
    urls: [],
    onChangeUrls: () => undefined,
  },
  render: () => (
    <LinkInputStory
      initialUrls={[
        "https://example.com/1",
        "https://example.com/2",
        "https://example.com/3",
        "https://example.com/4",
        "https://example.com/5",
      ]}
    />
  ),
};

export const KeyboardAndValidation: Story = {
  args: {
    urls: [],
    onChangeUrls: () => undefined,
  },
  render: () => <LinkInputStory initialUrls={[]} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole("textbox", { name: "リンク 1" });

    await userEvent.type(input, "  https://example.com/  {enter}");
    await expect(input).toHaveValue("https://example.com/");

    await userEvent.click(
      canvas.getByRole("button", { name: "リンク入力欄を追加" }),
    );
    const secondInput = canvas.getByRole("textbox", { name: "リンク 2" });
    await userEvent.type(secondInput, "https://example.com/{enter}");
    await expect(canvas.getByRole("alert")).toHaveTextContent(
      "このURLは追加済みです",
    );

    await userEvent.clear(input);
    await userEvent.type(input, "https://example.org/{enter}");
    await expect(input).toHaveValue("https://example.org/");
  },
};
