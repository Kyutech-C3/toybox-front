import { describe, expect, it, vi } from "vitest";
import { page, userEvent } from "vitest/browser";

import ModelControlsHelp from "./ModelCard/ModelControlsHelp";
import ModelViewer from "./ModelCard/ModelViewer";

import { render } from "@/test/render";

const createTriangle = () => {
  const positions = new Float32Array([0, 0, 0, 1, 0, 0, 0, 1, 0]);
  const buffer = btoa(String.fromCharCode(...new Uint8Array(positions.buffer)));
  return {
    asset: { version: "2.0" },
    scene: 0,
    scenes: [{ nodes: [0] }],
    nodes: [{ mesh: 0 }],
    meshes: [{ primitives: [{ attributes: { POSITION: 0 } }] }],
    buffers: [
      {
        uri: `data:application/octet-stream;base64,${buffer}`,
        byteLength: positions.byteLength,
      },
    ],
    bufferViews: [
      { buffer: 0, byteOffset: 0, byteLength: positions.byteLength },
    ],
    accessors: [
      {
        bufferView: 0,
        componentType: 5126,
        count: 3,
        type: "VEC3",
        min: [0, 0, 0],
        max: [1, 1, 0],
      },
    ],
  };
};

describe("3Dモデル", () => {
  it("ローカルGLTFを読み込み、キーボード操作とunmountが動作", async () => {
    const originalFetch = window.fetch.bind(window);
    vi.stubGlobal(
      "fetch",
      vi.fn<typeof fetch>().mockImplementation((input, init) => {
        const url = input instanceof Request ? input.url : String(input);
        return url.endsWith("/triangle.gltf")
          ? Promise.resolve(Response.json(createTriangle()))
          : originalFetch(input, init);
      }),
    );
    const onLoadError = vi.fn();
    const view = await render(
      <div style={{ width: 400, height: 300 }}>
        <ModelViewer
          src={`${location.origin}/triangle.gltf`}
          extension=".GLTF"
          onLoadError={onLoadError}
        />
      </div>,
    );
    await expect.element(page.getByRole("status")).not.toBeInTheDocument();
    expect(onLoadError).not.toHaveBeenCalled();
    const canvas = view.container.querySelector("canvas");
    if (!canvas) throw new Error("missing canvas");
    expect(canvas.width).toBeGreaterThan(0);
    for (const code of [
      "ArrowDown",
      "ArrowLeft",
      "ArrowRight",
      "ArrowUp",
      "KeyA",
      "KeyD",
      "KeyS",
      "KeyW",
      "Home",
    ]) {
      const event = new KeyboardEvent("keydown", {
        code,
        bubbles: true,
        cancelable: true,
      });
      canvas.dispatchEvent(event);
      expect(event.defaultPrevented).toBe(true);
    }
    const other = new KeyboardEvent("keydown", {
      code: "KeyZ",
      cancelable: true,
    });
    canvas.dispatchEvent(other);
    expect(other.defaultPrevented).toBe(false);
    await view.rerender(null);
    expect(view.container.querySelector("canvas")).toBeNull();
  });
  it("不正なモデルの読み込み失敗を通知", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(Response.json({}, { status: 404 })),
    );
    const onLoadError = vi.fn();
    await render(
      <div style={{ width: 400, height: 300 }}>
        <ModelViewer
          src={`${location.origin}/missing.gltf`}
          extension="gltf"
          onLoadError={onLoadError}
        />
      </div>,
    );
    await expect.poll(() => onLoadError.mock.calls.length).toBe(1);
  });
  it("操作ヘルプを開閉できる", async () => {
    await render(<ModelControlsHelp />);
    await page.getByRole("button").click();
    await expect.element(page.getByText(/W・A・S・D/)).toBeVisible();
    await userEvent.keyboard("{Escape}");
    await expect.element(page.getByRole("dialog")).not.toBeInTheDocument();
    await expect.element(page.getByRole("button")).toHaveFocus();
  });
});
