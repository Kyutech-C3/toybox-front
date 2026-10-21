import { useRef, useState } from "react";
import {
  expect,
  fireEvent,
  fn,
  userEvent,
  waitFor,
  within,
} from "storybook/test";

import Dialog from "./index";

import Button from "@/shared/ui/Button";

import type { Meta, StoryObj } from "@storybook/react";

const DialogPreview = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isChildOpen, setIsChildOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <div>
      <Button onClick={() => setIsOpen(true)}>モーダルを開く</Button>
      <Dialog
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        aria-label="共通モーダル"
        initialFocusRef={inputRef}
      >
        <label>
          入力 <input ref={inputRef} />
        </label>
        <Button onClick={() => setIsChildOpen(true)}>子モーダルを開く</Button>
        <Dialog
          isOpen={isChildOpen}
          onClose={() => setIsChildOpen(false)}
          aria-label="子モーダル"
        >
          <Button onClick={() => setIsChildOpen(false)}>
            子モーダルを閉じる
          </Button>
        </Dialog>
        <Button onClick={() => setIsOpen(false)}>モーダルを閉じる</Button>
      </Dialog>
    </div>
  );
};

const META: Meta<typeof Dialog> = {
  title: "UI/Dialog",
  component: Dialog,
  render: () => <DialogPreview />,
};

export default META;
type Story = StoryObj<typeof META>;

export const BackdropTap: Story = {
  tags: ["test"],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole("button", { name: "モーダルを開く" });
    await userEvent.click(trigger);
    const dialog = canvas.getByRole("dialog", { name: "共通モーダル" });
    await expect(within(dialog).getByRole("textbox")).toHaveFocus();
    const bounds = dialog.getBoundingClientRect();
    const point = {
      pointerId: 1,
      button: 0,
      clientX: bounds.right + 10,
      clientY: bounds.top,
    };

    // A drag that returns to its start must not become a background tap.
    fireEvent.pointerDown(dialog, point);
    fireEvent.pointerMove(dialog, { ...point, clientX: point.clientX + 20 });
    fireEvent.pointerUp(dialog, point);
    fireEvent.click(dialog, point);
    await expect(dialog).toBeVisible();

    // A second pointer invalidates the tap, even when neither pointer moves.
    fireEvent.pointerDown(dialog, point);
    fireEvent.pointerDown(dialog, { ...point, pointerId: 2 });
    fireEvent.pointerUp(dialog, { ...point, pointerId: 2 });
    fireEvent.pointerUp(dialog, point);
    fireEvent.click(dialog, point);
    await expect(dialog).toBeVisible();

    fireEvent.pointerDown(dialog, point);
    fireEvent.pointerUp(dialog, point);
    await expect(dialog).toBeVisible();
    const handleClick = fn();
    canvasElement.addEventListener("click", handleClick);
    try {
      fireEvent.click(dialog, point);
      await expect(handleClick).not.toHaveBeenCalled();
    } finally {
      canvasElement.removeEventListener("click", handleClick);
    }
    await waitFor(() => expect(dialog).not.toBeVisible());
    await expect(trigger).toHaveFocus();
    await expect(document.documentElement).not.toHaveAttribute(
      "data-scroll-locked",
    );
  },
};

export const NestedEscape: Story = {
  tags: ["test"],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole("button", { name: "モーダルを開く" });
    await userEvent.click(trigger);
    const parent = canvas.getByRole("dialog", { name: "共通モーダル" });
    const childTrigger = within(parent).getByRole("button", {
      name: "子モーダルを開く",
    });
    const first = within(parent).getByRole("textbox");
    const last = within(parent).getByRole("button", {
      name: /^モーダルを閉じる$/,
    });
    await userEvent.tab({ shift: true });
    await expect(last).toHaveFocus();
    await userEvent.tab();
    await expect(first).toHaveFocus();
    await userEvent.click(childTrigger);
    const child = canvas.getByRole("dialog", { name: "子モーダル" });
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(child).not.toBeVisible());
    await expect(parent).toBeVisible();
    await expect(childTrigger).toHaveFocus();
    await expect(document.documentElement).toHaveAttribute(
      "data-scroll-locked",
      "true",
    );
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(parent).not.toBeVisible());
    await expect(trigger).toHaveFocus();
    await expect(document.documentElement).not.toHaveAttribute(
      "data-scroll-locked",
    );
  },
};
