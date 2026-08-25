import { useContext } from "react";
import { useStore } from "zustand";

import WORK_EDITOR_STORE_CONTEXT from "./workEditorStoreContext";

import type { WorkEditorStore } from "./createWorkEditorStore";

/**
 * 編集画面の store へアクセスする唯一の入口。
 * store は WorkEditorStoreProvider がページごとに作るので、
 * このフックを経由せずに store の実体へ触らないこと。
 *
 * 命名規約チェックは `const useXxx = (...)` の形に対して
 * UseXxxParams / UseXxxReturn を要求するが、このフックはセレクタの
 * 戻り値をそのまま返すジェネリクスなので関数宣言で定義している。
 */
export function useWorkEditorStore<T>(
  selector: (state: WorkEditorStore) => T,
): T {
  const store = useContext(WORK_EDITOR_STORE_CONTEXT);

  if (!store) {
    throw new Error(
      "useWorkEditorStore must be used within WorkEditorStoreProvider",
    );
  }

  return useStore(store, selector);
}

export { selectIsUploading } from "./createWorkEditorStore";
