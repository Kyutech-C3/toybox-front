import { useState } from "react";
import { useNavigate } from "react-router-dom";
import ArrowDropUpRoundedIcon from "@mui/icons-material/ArrowDropUpRounded";
import { mutate } from "swr";

import { postWork } from "../../api/postWork";
import { buildWorkUpdatePayload, toWorkPayload } from "../../api/toWorkPayload";
import { updateWork } from "../../api/updateWork";
import {
  selectIsUploading,
  useWorkEditorStore,
} from "../../store/useWorkEditorStore";
import styles from "./index.module.css";

import { useAuthStore } from "@/features/auth/store/useAuthStore";
import Button from "@/shared/ui/Button";
import Dropdown from "@/shared/ui/Dropdown";
import useToast from "@/shared/ui/Toast/hook/useToast";

const PublishButton = () => {
  const mode = useWorkEditorStore((state) => state.mode);
  const workID = useWorkEditorStore((state) => state.workID);
  const current = useWorkEditorStore((state) => state.current);
  const baseline = useWorkEditorStore((state) => state.baseline);
  const setVisibility = useWorkEditorStore((state) => state.setVisibility);
  const isUploading = useWorkEditorStore(selectIsUploading);
  const accessToken = useAuthStore((state) => state.accessToken);
  const { showToast } = useToast();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const navigate = useNavigate();

  const { visibility } = current;
  const isEditMode = mode === "edit";
  const isSubmitDisabled = isUploading || isSubmitting;

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
        showToast({ message: "作品を保存しました", severity: "success" });
        navigate(`/work/${workID}`);
        return;
      }
      await postWork(toWorkPayload(current), accessToken);
      showToast({ message: "作品を投稿しました", severity: "success" });
      navigate("/");
    } catch {
      setSubmitError(
        isEditMode ? "作品の保存に失敗しました" : "作品の投稿に失敗しました",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const draftLabel = isEditMode ? "下書きとして保存" : "下書き保存";
  const publishLabel = visibility === "private" ? "限定公開" : "全体公開";

  return (
    <div
      className={styles["publish-button-wrapper"]}
      data-disabled={isSubmitDisabled ? "true" : "false"}
    >
      {visibility === "draft" ? (
        <Button
          variant="primary"
          onClick={() => void handleSubmit()}
          isDisabled={isSubmitDisabled}
        >
          {draftLabel}
        </Button>
      ) : (
        <>
          <button
            type="button"
            className={styles["publish-button"]}
            onClick={() => void handleSubmit()}
            disabled={isSubmitDisabled}
          >
            {isEditMode ? `${publishLabel}で保存` : publishLabel}
          </button>
          <span className={styles["button-span"]} />
          <button
            type="button"
            className={styles["menu-button"]}
            onClick={() => setIsMenuOpen((prev) => !prev)}
            disabled={isSubmitDisabled}
          >
            <ArrowDropUpRoundedIcon />
          </button>
          <span className={styles["menu-button-span"]}>
            <Dropdown
              isOpen={isMenuOpen}
              options={["全体公開", "限定公開"]}
              onSelect={(value) => {
                setIsMenuOpen(false);
                setVisibility(value === "限定公開" ? "private" : "public");
              }}
              selectedValues={
                visibility === "private" ? ["限定公開"] : ["全体公開"]
              }
              position="top"
            />
          </span>
        </>
      )}
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
