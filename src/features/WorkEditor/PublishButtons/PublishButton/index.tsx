import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { mutate } from "swr";

import { deletePendingResources } from "../../api/deletePendingResources";
import { postWork } from "../../api/postWork";
import { buildWorkUpdatePayload, toWorkPayload } from "../../api/toWorkPayload";
import { updateWork } from "../../api/updateWork";
import { getWorkEditorSWRKey } from "../../hook/useWorkForEdit";
import {
  selectHasUnsettledBackendWork,
  selectOrphanedBackendResources,
  useWorkEditorStore,
  useWorkEditorStoreApi,
} from "../../store/useWorkEditorStore";
import { validateWork } from "../../validateWork";
import styles from "./index.module.css";

import { useAuthStore } from "@/features/auth/store/useAuthStore";
import { getWorkDetailSWRKey } from "@/features/WorkDetail/hook/useWorkDetail";
import SplitButton from "@/shared/ui/SplitButton";
import useToast from "@/shared/ui/Toast/hook/useToast";
import VisibilityIcon, {
  VISIBILITY_TEXT_LABELS,
} from "@/shared/ui/VisibilityIcon";
import { ApiError } from "@/util/fetchData";

import type { WorkVisibility } from "@/shared/types/work";
import type { ListboxOption } from "@/shared/ui/Listbox";

const VISIBILITY_LABELS = VISIBILITY_TEXT_LABELS;

const VISIBILITY_OPTIONS = [
  {
    id: "public",
    value: "public",
    label: VISIBILITY_LABELS.public,
    icon: <VisibilityIcon visibility="public" />,
  },
  {
    id: "private",
    value: "private",
    label: VISIBILITY_LABELS.private,
    icon: <VisibilityIcon visibility="private" />,
  },
  {
    id: "draft",
    value: "draft",
    label: VISIBILITY_LABELS.draft,
    icon: <VisibilityIcon visibility="draft" />,
  },
] satisfies ListboxOption<WorkVisibility>[];
const VISIBILITY_CONFIRM_MESSAGES: Partial<Record<WorkVisibility, string>> = {
  public:
    "インターネット上の全ユーザがこのToyを閲覧できます。本当に全体公開しますか？",
  private: "C3の全ユーザがこのToyを閲覧できます。本当に限定公開しますか？",
};

const getSubmitErrorMessage = (
  error: unknown,
  isUpdatingPost: boolean,
  visibility: WorkVisibility,
) => {
  if (error instanceof ApiError) {
    if (error.status === 401) return "ログインの有効期限が切れました";
    if (error.status === 403) return "この作品を編集する権限がありません";
    if (error.status === 404)
      return "作品が見つかりません（削除された可能性があります）";
    if (error.status === 409) {
      return "他の場所で作品が更新されています。再読み込みしてください";
    }
    return error.displayMessage;
  }

  if (visibility === "draft") return "下書きの保存に失敗しました";
  return isUpdatingPost
    ? "投稿の更新に失敗しました"
    : "作品の投稿に失敗しました";
};

const PublishButton = () => {
  const mode = useWorkEditorStore((state) => state.mode);
  const workID = useWorkEditorStore((state) => state.workID);
  const current = useWorkEditorStore((state) => state.current);
  const baseline = useWorkEditorStore((state) => state.baseline);
  const setVisibility = useWorkEditorStore((state) => state.setVisibility);
  const markSaved = useWorkEditorStore((state) => state.markSaved);
  const hasInvalidUrls = useWorkEditorStore((state) => state.hasInvalidUrls);
  const hasUnsettledBackendWork = useWorkEditorStore(
    selectHasUnsettledBackendWork,
  );
  const isSubmitting = useWorkEditorStore((state) => state.isSubmitting);
  const setIsSubmitting = useWorkEditorStore((state) => state.setIsSubmitting);
  const accessToken = useAuthStore((state) => state.accessToken);
  const storeApi = useWorkEditorStoreApi();
  const { showToast } = useToast();
  const [submitError, setSubmitError] = useState("");
  const navigate = useNavigate();

  const hasAttemptedSubmit = useWorkEditorStore(
    (state) => state.hasAttemptedSubmit,
  );
  const setHasAttemptedSubmit = useWorkEditorStore(
    (state) => state.setHasAttemptedSubmit,
  );
  const validationErrors = validateWork(current);
  const hasValidationErrors = Object.keys(validationErrors).length > 0;

  const { visibility } = current;
  const isEditMode = mode === "edit";
  const isUpdatingPost = isEditMode && baseline.visibility !== "draft";
  const isSubmitDisabled =
    hasUnsettledBackendWork || hasInvalidUrls || isSubmitting;
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
    setHasAttemptedSubmit(true);
    setSubmitError("");
    if (hasValidationErrors) {
      requestAnimationFrame(() => {
        document
          .querySelector("[data-work-validation-error]")
          ?.scrollIntoView({ block: "center", behavior: "smooth" });
      });
      return;
    }
    const payload = toWorkPayload(current);

    const confirmMessage = VISIBILITY_CONFIRM_MESSAGES[visibility];
    if (confirmMessage && !window.confirm(confirmMessage)) return;

    setIsSubmitting(true);
    setSubmitError("");
    try {
      if (isEditMode && workID) {
        const updatePayload = buildWorkUpdatePayload(current, baseline);
        if (Object.keys(updatePayload).length === 0) {
          showToast({ message: "変更はありません", severity: "info" });
          navigate(`/works/${workID}`);
          return;
        }
        const updatedWork = await updateWork(
          workID,
          updatePayload,
          accessToken,
        );
        await Promise.all([
          mutate(getWorkDetailSWRKey(workID, accessToken), updatedWork, {
            revalidate: false,
          }),
          mutate(getWorkEditorSWRKey({ workID, accessToken }), updatedWork, {
            revalidate: false,
          }),
        ]);

        deleteOrphanedResources();
        markSaved();
        showToast({
          message:
            visibility === "draft"
              ? "下書きを保存しました"
              : isUpdatingPost
                ? "投稿を更新しました"
                : "作品を投稿しました",
          severity: "success",
        });
        navigate(`/works/${workID}`);
        return;
      }
      await postWork(payload, accessToken);
      deleteOrphanedResources();
      markSaved();
      showToast({
        message:
          visibility === "draft"
            ? "下書きを保存しました"
            : "作品を投稿しました",
        severity: "success",
      });
      navigate("/");
    } catch (error) {
      setSubmitError(getSubmitErrorMessage(error, isUpdatingPost, visibility));
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
    <SplitButton
      label={submitLabel}
      icon={<VisibilityIcon visibility={visibility} />}
      variant={visibility === "draft" ? "primary" : "accent"}
      onClick={() => void handleSubmit()}
      isDisabled={isSubmitDisabled}
      isLoading={isSubmitting}
      menuTriggerLabel="保存形式を選択"
      menuLabel="保存形式"
      options={VISIBILITY_OPTIONS}
      selectedValue={visibility}
      onSelect={setVisibility}
      notice={
        <>
          {hasUnsettledBackendWork && (
            <output>
              アップロードまたはタグの処理を完了してから保存できます
            </output>
          )}
          {hasInvalidUrls && (
            <output>URL入力のエラーを解消してから保存できます</output>
          )}
          {hasAttemptedSubmit &&
            hasValidationErrors &&
            !submitError &&
            !isSubmitDisabled && (
              <span className={styles["submit-error"]} role="alert">
                入力内容に{Object.keys(validationErrors).length}
                件のエラーがあります。各項目を確認してください。
              </span>
            )}
          {submitError && (
            <span className={styles["submit-error"]} role="alert">
              {submitError}
            </span>
          )}
        </>
      }
    />
  );
};
export default PublishButton;
