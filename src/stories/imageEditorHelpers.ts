import { act } from "react";
import { expect, spyOn, waitFor, within } from "storybook/test";

export const findImageEditor = async (
  canvasElement: HTMLElement,
  saveLabel = "保存",
) => {
  const dialog = within(
    await within(canvasElement.ownerDocument.body).findByRole("dialog"),
  );
  await waitFor(() =>
    expect(dialog.getByRole("button", { name: saveLabel })).toBeEnabled(),
  );
  return dialog;
};

// reset より後に画像処理が完了する順序を、待ち時間に依存せず再現する。
export const deferImageEncoding = () => {
  const originalToBlob = HTMLCanvasElement.prototype.toBlob;
  let complete: (() => Promise<void>) | undefined;
  const encoding = spyOn(
    HTMLCanvasElement.prototype,
    "toBlob",
  ).mockImplementation(function (
    this: HTMLCanvasElement,
    callback,
    type,
    quality,
  ) {
    if (type !== "image/webp") {
      originalToBlob.call(this, callback, type, quality);
      return;
    }
    complete = () =>
      new Promise<void>((resolve) => {
        originalToBlob.call(
          this,
          (blob) => {
            callback(blob);
            resolve();
          },
          type,
          quality,
        );
      });
  });
  return {
    waitForStart: () => waitFor(() => expect(complete).toBeDefined()),
    complete: async () => {
      if (!complete) throw new Error("Image encoding has not started");
      await act(complete);
    },
    restore: () => encoding.mockRestore(),
  };
};
