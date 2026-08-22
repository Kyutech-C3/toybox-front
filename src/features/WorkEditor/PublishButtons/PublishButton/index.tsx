import { useState } from "react";
import { useNavigate } from "react-router-dom";
import ArrowDropUpRoundedIcon from "@mui/icons-material/ArrowDropUpRounded";

import { postWork } from "../../api/postWork";
import { usePostWorkStore } from "../../store/usePostWorkStore";
import styles from "./index.module.css";

import { useAuthStore } from "@/features/auth/store/useAuthStore";
import Button from "@/shared/ui/Button";
import Dropdown from "@/shared/ui/Dropdown";

const PublishButton = () => {
  const {
    visibility,
    asset_ids,
    thumbnail_asset_id,
    pending_upload_count,
    tag_ids,
    description,
    title,
    urls,
    setVisibility,
  } = usePostWorkStore();
  const { accessToken } = useAuthStore();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const navigate = useNavigate();
  const isPublishDisabled = pending_upload_count > 0 || isSubmitting;

  const handlePublish = async () => {
    if (isPublishDisabled) return;
    if (!accessToken) {
      setSubmitError("ログインが必要です");
      return;
    }
    if (!thumbnail_asset_id) {
      setSubmitError("サムネイルのアップロードを完了してください");
      return;
    }
    setIsSubmitting(true);
    setSubmitError("");
    try {
      const response = await postWork(
        {
          asset_ids,
          description,
          tag_ids,
          title,
          thumbnail_asset_id,
          urls,
          visibility,
        },
        accessToken,
      );

      if (response !== null) navigate("/");
      else setSubmitError("作品の投稿に失敗しました");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className={styles["publish-button-wrapper"]}
      data-disabled={isPublishDisabled ? "true" : "false"}
    >
      {visibility === "draft" ? (
        <Button
          variant="primary"
          onClick={() => void handlePublish()}
          isDisabled={isPublishDisabled}
        >
          下書き保存
        </Button>
      ) : (
        <>
          <button
            type="button"
            className={styles["publish-button"]}
            onClick={() => void handlePublish()}
            disabled={isPublishDisabled}
          >
            {visibility === "private" ? "限定公開" : "全体公開"}
          </button>
          <span className={styles["button-span"]} />
          <button
            type="button"
            className={styles["menu-button"]}
            onClick={() => setIsMenuOpen((prev) => !prev)}
            disabled={isPublishDisabled}
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
      {pending_upload_count > 0 && (
        <output className={styles["upload-notice"]}>
          アップロード完了後に投稿できます
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
