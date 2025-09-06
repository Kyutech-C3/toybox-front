import type { Meta, StoryObj } from "@storybook/react";
import Card from "./index";

const meta: Meta<typeof Card> = {
  title: "UI/Card",
  component: Card,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    title: { control: "text" },
    postDate: { control: "date" },
    tags: { control: "object" },
    avaterURL: { control: "text" },
    imageURL: { control: "text" },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    title: "Sample Blog Post",
    postDate: new Date("2024-01-15"),
    tags: ["React", "TypeScript", "UI"],
    avaterURL: "./comingSoonLugia.webp",
    imageURL: "./comingSoonHo-Oh.webp",
  },
};

export const WithCustomContent: Story = {
  args: {
    title: "Building Modern Web Applications",
    postDate: new Date("2024-03-22"),
    tags: ["JavaScript", "Frontend", "Development"],
    avaterURL: "./comingSoonLugia.webp",
    imageURL: "./comingSoonHo-Oh.webp",
  },
};

export const WithManyTags: Story = {
  args: {
    title: "Exploring Advanced Concepts",
    postDate: new Date("2024-02-10"),
    tags: [
      "React",
      "TypeScript",
      "Storybook",
      "Testing",
      "Performance",
      "Accessibility",
    ],
    avaterURL: "./comingSoonLugia.webp",
    imageURL: "./comingSoonHo-Oh.webp",
  },
};
