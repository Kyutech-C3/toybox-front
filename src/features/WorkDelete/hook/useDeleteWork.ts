import { useState } from "react";
import { mutate } from "swr";

import { deleteWork } from "../api/deleteWork";

import { useAuthStore } from "@/features/auth/store/useAuthStore";
import { useUserStore } from "@/features/auth/store/useUserStore";
import useToast from "@/shared/ui/Toast/hook/useToast";
import { ApiError } from "@/util/fetchData";

type UseDeleteWorkParams = {
  workID: string;
  ownerID: string;
  onDeleted?: () => void;
};

type UseDeleteWorkReturn = {
  canDelete: boolean;
  isDeleting: boolean;
  handleDelete: () => Promise<void>;
};

const DELETE_CONFIRM_MESSAGE =
  "この作品を削除します。削除すると元に戻せません。よろしいですか？";

const getDeleteErrorMessage = (error: unknown) => {
  if (error instanceof ApiError) {
    if (error.status === 401) return "ログインの有効期限が切れました";
    if (error.status === 403) return "この作品を削除する権限がありません";
    if (error.status === 404) return "作品が見つかりません";
    if (error.status >= 500) {
      return "サーバーエラーが発生しました。時間をおいて再試行してください";
    }
  }

  return "作品の削除に失敗しました";
};

const isWorkRelatedSWRKey = (key: unknown) => {
  const keyParts = Array.isArray(key) ? key : [key];

  return keyParts.some(
    (part) =>
      typeof part === "string" &&
      (part.startsWith("/works") || part === "work-editor"),
  );
};

const useDeleteWork = ({
  workID,
  ownerID,
  onDeleted,
}: UseDeleteWorkParams): UseDeleteWorkReturn => {
  const accessToken = useAuthStore((state) => state.accessToken);
  const currentUser = useUserStore((state) => state.user);
  const { showToast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);

  const canDelete = Boolean(
    accessToken && currentUser && currentUser.id === ownerID,
  );

  const handleDelete = async () => {
    if (!canDelete || !accessToken || isDeleting) return;
    if (!window.confirm(DELETE_CONFIRM_MESSAGE)) return;

    setIsDeleting(true);
    try {
      await deleteWork(workID, accessToken);
      // 先に離脱してからキャッシュを落とす（削除済みの作品を再取得させないため）
      onDeleted?.();
      showToast({ message: "作品を削除しました", severity: "success" });
      await mutate(isWorkRelatedSWRKey, undefined, { revalidate: false });
    } catch (error) {
      showToast({ message: getDeleteErrorMessage(error), severity: "error" });
    } finally {
      setIsDeleting(false);
    }
  };

  return { canDelete, isDeleting, handleDelete };
};

export default useDeleteWork;
