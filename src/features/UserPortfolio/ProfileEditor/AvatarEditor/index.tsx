import { useEffect, useRef, useState } from "react";

import styles from "./index.module.css";

import Avatar from "@/shared/ui/Avatar";
import Button from "@/shared/ui/Button";
import FieldError from "@/shared/ui/FieldError";
import ImageEditorDialog from "@/shared/ui/ImageEditorDialog";
import { IMAGE_ACCEPT } from "@/util/imageProcessing";

type AvatarEditorProps = {
  avatarURL: string;
  isDisabled: boolean;
};

type EditedAvatar = {
  file: File;
  source: File;
  url: string;
};

const AvatarEditor = ({ avatarURL, isDisabled }: AvatarEditorProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const requestRef = useRef<AbortController | null>(null);
  const isMountedRef = useRef(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [editedAvatar, setEditedAvatar] = useState<EditedAvatar | null>(null);
  const [isLoadingImage, setIsLoadingImage] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      requestRef.current?.abort();
    };
  }, []);

  useEffect(
    () => () => {
      if (editedAvatar) URL.revokeObjectURL(editedAvatar.url);
    },
    [editedAvatar],
  );

  const handleSelect = (file: File | undefined) => {
    if (!file) return;
    const extension = `.${file.name.split(".").pop()?.toLowerCase()}`;
    if (!IMAGE_ACCEPT.split(",").includes(extension)) {
      setError("対応していない画像形式です");
      return;
    }
    setError("");
    setPendingFile(file);
  };

  const handleEdit = async () => {
    if (editedAvatar) {
      setPendingFile(editedAvatar.source);
      return;
    }
    if (!avatarURL || isLoadingImage) return;
    const controller = new AbortController();
    requestRef.current = controller;
    setIsLoadingImage(true);
    setError("");
    try {
      const response = await fetch(avatarURL, { signal: controller.signal });
      if (!response.ok) throw new Error("Failed to load image");
      const blob = await response.blob();
      if (isMountedRef.current && !controller.signal.aborted) {
        setPendingFile(new File([blob], "icon.png", { type: blob.type }));
      }
    } catch {
      if (isMountedRef.current && !controller.signal.aborted) {
        setError(
          "画像を読み込めませんでした。端末から画像を選択してください。",
        );
      }
    } finally {
      if (isMountedRef.current) setIsLoadingImage(false);
    }
  };

  const handleApply = (file: File) => {
    if (!pendingFile) return;
    setEditedAvatar({
      file,
      source: pendingFile,
      url: URL.createObjectURL(file),
    });
    setPendingFile(null);
  };

  return (
    <section className={styles["avatar-editor"]} aria-label="アイコン画像">
      <h3>アイコン画像</h3>
      <div className={styles["preview-row"]}>
        <Avatar
          avatarURL={editedAvatar?.url ?? (avatarURL || undefined)}
          alt="アイコン画像のプレビュー"
          size="profile"
        />
        <div className={styles["actions"]}>
          <Button
            variant="secondary"
            onClick={() => inputRef.current?.click()}
            disabled={isDisabled || isLoadingImage}
          >
            写真を選択
          </Button>
          {(editedAvatar || avatarURL) && (
            <Button
              variant="secondary"
              onClick={() => void handleEdit()}
              disabled={isDisabled}
              isLoading={isLoadingImage}
            >
              アイコン画像を編集
            </Button>
          )}
        </div>
      </div>
      <input
        ref={inputRef}
        className={styles["file-input"]}
        type="file"
        accept={IMAGE_ACCEPT}
        aria-label="アイコン画像のファイル選択"
        tabIndex={-1}
        disabled={isDisabled || isLoadingImage}
        onChange={(event) => {
          handleSelect(event.target.files?.[0]);
          event.target.value = "";
        }}
      />
      <p className={styles["help"]}>
        アイコン画像の保存は準備中です。ここでは編集とプレビューができ、プロフィールを保存しても画像は更新されません。
      </p>
      {editedAvatar && (
        <div className={styles["actions"]}>
          <a
            className={styles["download"]}
            href={editedAvatar.url}
            download={editedAvatar.file.name}
          >
            加工画像をダウンロード
          </a>
          <Button
            variant="secondary"
            size="small"
            onClick={() => setEditedAvatar(null)}
            disabled={isDisabled}
          >
            元のアイコンに戻す
          </Button>
        </div>
      )}
      {error && <FieldError role="alert">{error}</FieldError>}
      {pendingFile && (
        <ImageEditorDialog
          file={pendingFile}
          purpose="avatar"
          onConfirm={handleApply}
          onClose={() => setPendingFile(null)}
        />
      )}
    </section>
  );
};

export default AvatarEditor;
