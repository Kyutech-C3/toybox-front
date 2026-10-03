import { useEffect, useState } from "react";
import AddRoundedIcon from "@mui/icons-material/AddRounded";

import styles from "./index.module.css";

import Avatar from "@/shared/ui/Avatar";
import EditButton from "@/shared/ui/EditButton";
import ImageEditorDialog from "@/shared/ui/ImageEditorDialog";
import useToast from "@/shared/ui/Toast/hook/useToast";
import UploadArea from "@/shared/ui/UploadArea";
import { IMAGE_ACCEPT } from "@/util/imageProcessing";

import type { ImageEditState } from "@/shared/ui/ImageEditorDialog";

type AvatarEditorProps = {
  avatarURL: string;
  isDisabled: boolean;
  onChange?: (hasChanges: boolean) => void;
};

type SelectedAvatar = {
  file: File;
  url: string;
  edit?: ImageEditState;
};

type PendingAvatarEdit = {
  file: File;
  initialEdit?: ImageEditState;
};

const AvatarEditorSession = ({
  avatarURL,
  isDisabled,
  onChange,
}: AvatarEditorProps) => {
  const { showToast } = useToast();
  const [pendingEdit, setPendingEdit] = useState<PendingAvatarEdit | null>(
    null,
  );
  const [selectedAvatar, setSelectedAvatar] = useState<SelectedAvatar | null>(
    null,
  );
  const hasChanges = selectedAvatar !== null || pendingEdit !== null;
  useEffect(() => {
    onChange?.(hasChanges);
  }, [onChange, hasChanges]);

  useEffect(
    () => () => {
      if (selectedAvatar) URL.revokeObjectURL(selectedAvatar.url);
    },
    [selectedAvatar],
  );

  const handleSelect = (file: File | undefined) => {
    if (!file || isDisabled) return;
    const extension = `.${file.name.split(".").pop()?.toLowerCase()}`;
    if (!IMAGE_ACCEPT.split(",").includes(extension)) {
      showToast({ message: "対応していない画像形式です", severity: "error" });
      return;
    }
    setPendingEdit({ file });
  };

  const handleEdit = () => {
    if (!selectedAvatar || isDisabled) return;
    setPendingEdit({
      file: selectedAvatar.file,
      initialEdit: selectedAvatar.edit,
    });
  };

  const handleApply = (file: File, edit: ImageEditState) => {
    if (!pendingEdit || isDisabled) return;
    setSelectedAvatar({
      file: pendingEdit.file,
      url: URL.createObjectURL(file),
      edit,
    });
    setPendingEdit(null);
  };

  const previewURL = selectedAvatar?.url ?? avatarURL;

  return (
    <div className={styles["avatar-preview"]}>
      <UploadArea
        accept={IMAGE_ACCEPT}
        ariaLabel="アイコン画像をアップロード"
        onSelectFiles={(files) => handleSelect(files[0])}
        isDisabled={isDisabled}
        isEmbedded
        className={styles["upload-area"]}
      >
        <Avatar
          avatarURL={previewURL || undefined}
          alt="アイコン画像のプレビュー"
          size="profile"
        />
        <span className={styles["select-overlay"]} aria-hidden="true">
          <AddRoundedIcon />
        </span>
      </UploadArea>
      {selectedAvatar && (
        <EditButton
          ariaLabel="アイコン画像を編集"
          onEdit={handleEdit}
          isDisabled={isDisabled}
        />
      )}
      {pendingEdit && (
        <ImageEditorDialog
          file={pendingEdit.file}
          purpose="avatar"
          initialEdit={pendingEdit.initialEdit}
          onConfirm={handleApply}
          onClose={() => setPendingEdit(null)}
        />
      )}
    </div>
  );
};

const AvatarEditor = (props: AvatarEditorProps) => (
  <AvatarEditorSession key={props.avatarURL} {...props} />
);

export default AvatarEditor;
