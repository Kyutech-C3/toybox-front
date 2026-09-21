import { useState } from "react";
import { expect, userEvent, within } from "storybook/test";

import Switch from "./index";

import type { Meta, StoryObj } from "@storybook/react";

const META: Meta<typeof Switch> = {
  title: "UI/Switch",
  component: Switch,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "Blog" }));
    await expect(canvas.getByRole("button", { name: "Blog" })).toHaveAttribute(
      "data-is-toy",
      "false",
    );
    await userEvent.click(canvas.getByRole("button", { name: "Toy" }));
    await expect(canvas.getByRole("button", { name: "Toy" })).toHaveAttribute(
      "data-is-toy",
      "true",
    );
  },
};

export default META;
type Story = StoryObj<typeof META>;

type SwitchWithStateProps = {
  isInitiallyToy?: boolean;
};

const SwitchWithState = ({ isInitiallyToy = true }: SwitchWithStateProps) => {
  const [isToy, setIsToy] = useState(isInitiallyToy);
  return <Switch isToy={isToy} onChange={setIsToy} />;
};

export const ToySelected: Story = {
  render: () => <SwitchWithState isInitiallyToy={true} />,
};

export const BlogSelected: Story = {
  render: () => <SwitchWithState isInitiallyToy={false} />,
};
