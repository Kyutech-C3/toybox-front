import { describe, expect, it } from "vitest";

import { getSafeAssetURL } from "./assetUrl";

describe("アセットURL", () => {
  it.each([
    "javascript:alert(1)",
    "data:text/html,hello",
    "blob:https://example.com/id",
    "/relative.png",
    "invalid",
    "file:///tmp/a",
    "",
  ])("不正なURLを拒否 %s", (url) => {
    expect(getSafeAssetURL(url)).toBeUndefined();
  });

  it.each(["https://example.com/a.png?key=1#hash", "http://example.com/a.zip"])(
    "http(s) URLを許可 %s",
    (url) => {
      expect(getSafeAssetURL(url)).toBe(url);
    },
  );
});
