import { MemoryRouter } from "react-router-dom";
import IosShareRoundedIcon from "@mui/icons-material/IosShareRounded";

import WorkAuthorBar from "./index";

import Button from "@/shared/ui/Button";
import LikeButton from "@/shared/ui/LikeButton";

import type { Meta, StoryObj } from "@storybook/react";

const ACTIONS = (
  <>
    <Button
      variant="ghost"
      size="small"
      isIconOnly
      icon={<IosShareRoundedIcon />}
      aria-label="この作品を共有する"
    />
    <LikeButton isLiked={false} count={12} isCountVisible onToggle={() => {}} />
  </>
);

const META = {
  title: "UI/WorkAuthorBar",
  component: WorkAuthorBar,
  args: {
    userID: "user-1",
    displayName: "とても長い表示名のユーザーさん",
    actions: ACTIONS,
  },
  decorators: [
    (Story) => (
      <MemoryRouter>
        <div style={{ width: "min(720px, 90vw)" }}>
          <Story />
        </div>
      </MemoryRouter>
    ),
  ],
} satisfies Meta<typeof WorkAuthorBar>;

export default META;
type Story = StoryObj<typeof META>;

export const Default: Story = {};

export const Owner: Story = {
  args: { editPath: "/edit/work-1" },
};
