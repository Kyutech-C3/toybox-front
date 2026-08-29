import { useState } from "react";
import { useNavigate } from "react-router-dom";
import ArrowDropUpRoundedIcon from "@mui/icons-material/ArrowDropUpRounded";
import { mutate } from "swr";

import { deletePendingResources } from "../../api/deletePendingResources";
import { postWork } from "../../api/postWork";
import { buildWorkUpdatePayload, toWorkPayload } from "../../api/toWorkPayload";
import { updateWork } from "../../api/updateWork";
import {
  selectIsUploading,
  selectOrphanedBackendResources,
  useWorkEditorStore,
  useWorkEditorStoreApi,
} from "../../store/useWorkEditorStore";
import styles from "./index.module.css";

import { useAuthStore } from "@/features/auth/store/useAuthStore";
import Dropdown from "@/shared/ui/Dropdown";
import useToast from "@/shared/ui/Toast/hook/useToast";
import { ApiError } from "@/util/fetchData";

import type { WorkVisibility } from "@/shared/types/work";

const VISIBILITY_LABELS: Record<WorkVisibility, string> = {
  public: "全体公開",
  private: "限定公開",
  draft: "下書き",
};

const VISIBILITY_OPTIONS = [
  VISIBILITY_LABELS.public,
  VISIBILITY_LABELS.private,
  VISIBILITY_LABELS.draft,
];
const VISIBILITY_CONFIRM_MESSAGES: Partial<Record<WorkVisibility, string>> = {
  public:
    "インターネット上の全ユーザがこのToyを閲覧できます。本当に全体公開しますか？",
  private: "C3の全ユーザがこのToyを閲覧できます。本当に限定公開しますか？",
};

const toVisibility = (label: string): WorkVisibility => {
  if (label === VISIBILITY_LABELS.public) return "public";
  if (label === VISIBILITY_LABELS.private) return "private";
  return "draft";
};

const getSubmitErrorMessage = (error: unknown, isEditMode: boolean) => {
  if (error instanceof ApiError) {
    if (error.status === 401) return "ログインの有効期限が切れました";
    if (error.status === 403) return "この作品を編集する権限がありません";
    if (error.status === 404)
      return "作品が見つかりません（削除された可能性があります）";
    if (error.status === 409) {
      return "他の場所で作品が更新されています。再読み込みしてください";
    }
    if (error.status >= 500) {
      return "サーバーエラーが発生しました。時間をおいて再試行してください";
    }
  }

  return isEditMode ? "作品の保存に失敗しました" : "作品の投稿に失敗しました";
};

const PublishButton = () => {
  const mode = useWorkEditorStore((state) => state.mode);
  const workID = useWorkEditorStore((state) => state.workID);
  const current = useWorkEditorStore((state) => state.current);
  const baseline = useWorkEditorStore((state) => state.baseline);
  const setVisibility = useWorkEditorStore((state) => state.setVisibility);
  const markSaved = useWorkEditorStore((state) => state.markSaved);
  const isUploading = useWorkEditorStore(selectIsUploading);
  const accessToken = useAuthStore((state) => state.accessToken);
  const storeApi = useWorkEditorStoreApi();
  const { showToast } = useToast();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const navigate = useNavigate();

  const { visibility } = current;
  const isEditMode = mode === "edit";
  const isSubmitDisabled = isUploading || isSubmitting;
  const deleteOrphanedResources = () => {
    const orphaned = selectOrphanedBackendResources(storeApi.getState());
    if (orphaned.assetIDs.length === 0 && orphaned.tagIDs.length === 0) return;
    if (!accessToken) return;
    void deletePendingResources(orphaned, accessToken);
  };

  const handleSubmit = async () => {
    if (isSubmitDisabled) return;
    if (!accessToken) {
      setSubmitError("ログインが必要です");
      return;
    }
    if (!current.thumbnail?.assetID) {
      setSubmitError("サムネイルのアップロードを完了してください");
      return;
    }

    const confirmMessage = VISIBILITY_CONFIRM_MESSAGES[visibility];
    if (confirmMessage && !window.confirm(confirmMessage)) return;

    setIsSubmitting(true);
    setSubmitError("");
    try {
      if (isEditMode && workID) {
        const updatePayload = buildWorkUpdatePayload(current, baseline);
        if (Object.keys(updatePayload).length === 0) {
          showToast({ message: "変更はありません", severity: "info" });
          navigate(`/work/${workID}`);
          return;
        }
        const updatedWork = await updateWork(
          workID,
          updatePayload,
          accessToken,
        );
        await mutate(`/works/${workID}`, updatedWork, { revalidate: false });

        deleteOrphanedResources();
        markSaved();
        showToast({ message: "作品を保存しました", severity: "success" });
        navigate(`/work/${workID}`);
        return;
      }
      await postWork(toWorkPayload(current), accessToken);
      deleteOrphanedResources();
      markSaved();
      showToast({ message: "作品を投稿しました", severity: "success" });
      navigate("/");
    } catch (error) {
      setSubmitError(getSubmitErrorMessage(error, isEditMode));
    } finally {
      setIsSubmitting(false);
    }
  };

  const visibilityLabel = VISIBILITY_LABELS[visibility];
  const submitLabel = isEditMode
    ? `${visibilityLabel}`
    : visibility === "draft"
      ? "下書き保存"
      : visibilityLabel;

  return (
    <div
      className={styles["publish-button-wrapper"]}
      data-disabled={isSubmitDisabled ? "true" : "false"}
      data-visibility={visibility}
    >
      <button
        type="button"
        className={styles["publish-button"]}
        onClick={() => void handleSubmit()}
        disabled={isSubmitDisabled}
      >
        {submitLabel}
      </button>
      <span className={styles["button-span"]} />
      <button
        type="button"
        className={styles["menu-button"]}
        onClick={() => setIsMenuOpen((prev) => !prev)}
        disabled={isSubmitDisabled}
        aria-label="保存形式を選択"
      >
        <ArrowDropUpRoundedIcon />
      </button>
      <span className={styles["menu-button-span"]}>
        <Dropdown
          isOpen={isMenuOpen}
          options={VISIBILITY_OPTIONS}
          onSelect={(value) => {
            setIsMenuOpen(false);
            setVisibility(toVisibility(value));
          }}
          selectedValues={[visibilityLabel]}
          position="top"
        />
      </span>
      {isUploading && (
        <output className={styles["upload-notice"]}>
          アップロード完了後に保存できます
        </output>
      )}
      {submitError && (
        <span className={styles["submit-error"]} role="alert">
          {submitError}
        </span>
      )}
    </div>
  );
};
export default PublishButton;
