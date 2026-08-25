import useSWR from "swr";

import { getWork } from "../api/getWork";

import { useAuthStore } from "@/features/auth/store/useAuthStore";

import type { Work } from "@/shared/types/work";

type GetWorkEditorSWRKeyParams = {
  workID: string;
};

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

  const { data, isValidating } = useSWR<Work>(
    workID ? getWorkEditorSWRKey({ workID }) : null,
    fetchWork,
    {
      revalidateOnMount: true,
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    },
  );

  return { data: isValidating ? undefined : data };
};

export default useWorkForEdit;
