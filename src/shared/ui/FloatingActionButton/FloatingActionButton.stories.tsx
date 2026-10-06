import AddRoundedIcon from "@mui/icons-material/AddRounded";

import FloatingActionButton from "./index";

import type { Meta, StoryObj } from "@storybook/react";

const META = {
  title: "UI/FloatingActionButton",
  component: FloatingActionButton,
  args: {
    label: "投稿",
    icon: <AddRoundedIcon fontSize="inherit" />,
    onClick: () => {},
  },
} satisfies Meta<typeof FloatingActionButton>;

export default META;
type Story = StoryObj<typeof META>;

export const Default: Story = {};
