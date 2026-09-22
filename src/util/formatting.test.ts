import { describe, expect, it } from "vitest";

import { formatDateTime } from "./formatDateTime";
import { normalizeInputText } from "./normalizeInputText";

describe("入力と表示", () => {
  it.each([
    ["　ＡＢＣ１２３　", "ABC123"],
    ["  日本語\n", "日本語"],
    ["ﾃｽﾄ", "テスト"],
    ["", ""],
  ])("正規化 %s", (input, expected) => {
    expect(normalizeInputText(input)).toBe(expected);
  });
  it("ローカル時刻をゼロ埋めする（実行環境のタイムゾーンに依存しない）", () => {
    expect(formatDateTime(new Date(2026, 0, 2, 3, 4))).toBe("2026/01/02 03:04");
    expect(formatDateTime("2026-12-31T23:59:00")).toBe("2026/12/31 23:59");
  });
});
