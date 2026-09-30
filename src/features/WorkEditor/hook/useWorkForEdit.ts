import useSWR from "swr";

import { getWork } from "../api/getWork";

import { useAuthStore } from "@/features/auth/store/useAuthStore";

import type { Work } from "@/shared/types/work";

export const WORK_EDITOR_SWR_KEY_PREFIX = "work-editor";

type GetWorkEditorSWRKeyParams = {
  workID: string;
  accessToken: string | null;
};

export const getWorkEditorSWRKey = ({
  workID,
  accessToken,
}: GetWorkEditorSWRKeyParams) =>
  [WORK_EDITOR_SWR_KEY_PREFIX, workID, accessToken] as const;

export const isWorkEditorSWRKey = (key: unknown) =>
  Array.isArray(key) && key[0] === WORK_EDITOR_SWR_KEY_PREFIX;

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

  const { data, isValidating } = useSWR<Work>(
    workID ? getWorkEditorSWRKey({ workID, accessToken }) : null,
    ([, swrWorkID, token]: ReturnType<typeof getWorkEditorSWRKey>) =>
      getWork(swrWorkID, token ?? undefined),
    {
      revalidateOnMount: true,
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      keepPreviousData: true,
    },
  );

  return { data: isValidating ? undefined : data };
};

export default useWorkForEdit;
