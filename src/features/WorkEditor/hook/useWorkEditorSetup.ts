import { useEffect } from "react";
import { mutate } from "swr";

import { useWorkEditorStore } from "../store/useWorkEditorStore";
import useWorkForEdit, { getWorkEditorSWRKey } from "./useWorkForEdit";

import { useUserStore } from "@/features/auth/store/useUserStore";

export type WorkEditorSetupStatus = "loading" | "ready" | "forbidden";

type UseWorkEditorSetupParams = {
  /** 新規投稿なら null、編集なら対象作品の ID */
  workID: string | null;
};

type UseWorkEditorSetupReturn = {
  status: WorkEditorSetupStatus;
};

/**
 * 編集画面の初期化を担当する。
 * 取得した作品を store へ流し込むのは対象 ID につき 1 回だけ。
 * 毎回流し込むと、SWR の再検証で編集中の入力が上書きされてしまう。
 *
 * 取得は suspense モードなので、読み込み中は Suspense、取得失敗は
 * PageErrorBoundary が受け持つ。ここでは扱わない。
 */
const useWorkEditorSetup = ({
  workID,
}: UseWorkEditorSetupParams): UseWorkEditorSetupReturn => {
  const currentUser = useUserStore((state) => state.user);
  const initializedKey = useWorkEditorStore((state) => state.initializedKey);
  const initializeForNew = useWorkEditorStore(
    (state) => state.initializeForNew,
  );
  const initializeForEdit = useWorkEditorStore(
    (state) => state.initializeForEdit,
  );
  const resetEditor = useWorkEditorStore((state) => state.resetEditor);

  const { data } = useWorkForEdit({ workID });

  const isOwner = Boolean(
    data && currentUser && data.user.id === currentUser.id,
  );

  useEffect(() => {
    if (workID === null) {
      initializeForNew();
      return;
    }
    if (!data || !isOwner) return;
    initializeForEdit(data);
  }, [workID, data, isOwner, initializeForNew, initializeForEdit]);

  useEffect(() => {
    return () => {
      // store を空にする。blob URL の解放もここで行われる
      // （store はコンポーネントより長生きするため）。
      resetEditor();
      // 次に開いたときに必ず取り直すよう、編集用のキャッシュも捨てる。
      if (workID) {
        void mutate(getWorkEditorSWRKey({ workID }), undefined, {
          revalidate: false,
        });
      }
    };
  }, [resetEditor, workID]);

  if (workID === null) {
    return { status: initializedKey === "new" ? "ready" : "loading" };
  }
  // ログインユーザーは Header が非同期に取得するため、
  // 未取得のうちは所有者判定ができない。forbidden を誤表示しないよう loading 扱いにする。
  if (!currentUser) return { status: "loading" };
  if (!isOwner) return { status: "forbidden" };
  return { status: initializedKey === workID ? "ready" : "loading" };
};

export default useWorkEditorSetup;
