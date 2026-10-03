import { useEffect, useRef, useState } from "react";

import styles from "./index.module.css";

import Avatar from "@/shared/ui/Avatar";
import ImageEditButton from "@/shared/ui/ImageEditButton";
import ImageEditorDialog from "@/shared/ui/ImageEditorDialog";
import useToast from "@/shared/ui/Toast/hook/useToast";
import { IMAGE_ACCEPT } from "@/util/imageProcessing";

import type {
  ImageEditorSource,
  ImageEditState,
} from "@/shared/ui/ImageEditorDialog";

type AvatarEditorProps = {
  avatarURL: string;
  isDisabled: boolean;
};

type EditedAvatar = {
  source: ImageEditorSource;
  url: string;
  edit: ImageEditState;
};

type PendingAvatarEdit = {
  source: ImageEditorSource;
  initialEdit?: ImageEditState;
};

const AvatarEditor = ({ avatarURL, isDisabled }: AvatarEditorProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const previousAvatarURLRef = useRef(avatarURL);
  const { showToast } = useToast();
  const [pendingEdit, setPendingEdit] = useState<PendingAvatarEdit | null>(
    null,
  );
  const [editedAvatar, setEditedAvatar] = useState<EditedAvatar | null>(null);

  useEffect(() => {
    if (previousAvatarURLRef.current === avatarURL) return;
    previousAvatarURLRef.current = avatarURL;
    setPendingEdit(null);
    setEditedAvatar(null);
  }, [avatarURL]);

  useEffect(
    () => () => {
      if (editedAvatar) URL.revokeObjectURL(editedAvatar.url);
    },
    [editedAvatar],
  );

  const handleSelect = (file: File | undefined) => {
    if (!file || isDisabled) return;
    const extension = `.${file.name.split(".").pop()?.toLowerCase()}`;
    if (!IMAGE_ACCEPT.split(",").includes(extension)) {
      showToast({ message: "対応していない画像形式です", severity: "error" });
      return;
    }
    setPendingEdit({ source: { file } });
  };

  const handleEdit = () => {
    if (isDisabled) return;
    if (editedAvatar) {
      setPendingEdit({
        source: editedAvatar.source,
        initialEdit: editedAvatar.edit,
      });
      return;
    }
    if (!avatarURL) {
      inputRef.current?.click();
      return;
    }
    setPendingEdit({ source: { imageURL: avatarURL, fileName: "icon.png" } });
  };

  const handleApply = (file: File, edit: ImageEditState) => {
    if (!pendingEdit) return;
    setEditedAvatar({
      source: pendingEdit.source,
      url: URL.createObjectURL(file),
      edit,
    });
    setPendingEdit(null);
  };

  return (
    <div className={styles["avatar-preview"]}>
      <Avatar
        avatarURL={editedAvatar?.url ?? (avatarURL || undefined)}
        alt="アイコン画像のプレビュー"
        size="profile"
      />
      <ImageEditButton
        className={styles["edit-button"]}
        ariaLabel="アイコン画像を編集"
        onEdit={handleEdit}
        onSelectPhoto={() => inputRef.current?.click()}
        isDisabled={isDisabled}
      />
      <input
        ref={inputRef}
        className={styles["file-input"]}
        type="file"
        accept={IMAGE_ACCEPT}
        aria-label="アイコン画像のファイル選択"
        tabIndex={-1}
        disabled={isDisabled}
        onChange={(event) => {
          handleSelect(event.target.files?.[0]);
          event.target.value = "";
        }}
      />
      {pendingEdit && (
        <ImageEditorDialog
          {...pendingEdit.source}
          purpose="avatar"
          initialEdit={pendingEdit.initialEdit}
          onConfirm={handleApply}
          onClose={() => setPendingEdit(null)}
        />
      )}
    </div>
  );
};

export default AvatarEditor;
