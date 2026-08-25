import useSWR from "swr";

import { getWork } from "../api/getWork";

import { useAuthStore } from "@/features/auth/store/useAuthStore";

import type { Work } from "@/shared/types/work";

type GetWorkEditorSWRKeyParams = {
  workID: string;
};

/**
 * 編集画面専用の SWR キー。
 * 作品詳細（/works/{id}）とキャッシュを共有すると、詳細画面で取得済みの
 * 古い内容から編集画面が初期化されてしまうため、キーを分けている。
 * 画面を離れるときに破棄するので、開き直せば必ずサーバーから取り直す。
 */
export const getWorkEditorSWRKey = ({ workID }: GetWorkEditorSWRKeyParams) => [
  "work-editor",
  workID,
];

type UseWorkForEditParams = {
  workID: string | null;
};

type UseWorkForEditReturn = {
  data: Work | undefined;
};

const useWorkForEdit = ({
  workID,
}: UseWorkForEditParams): UseWorkForEditReturn => {
  const accessToken = useAuthStore((state) => state.accessToken);

  const fetchWork = async () => {
    if (!workID) throw new Error("workID is required");
    return getWork(workID, accessToken ?? undefined);
  };

  const { data } = useSWR<Work>(
    workID ? getWorkEditorSWRKey({ workID }) : null,
    fetchWork,
    {
      // 編集中に勝手に取り直させない
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    },
  );

  return { data };
};

export default useWorkForEdit;
