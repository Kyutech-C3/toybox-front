import { useRef, useState } from "react";

import UploadPrompt from "../UploadPrompt";
import styles from "./index.module.css";

import Button from "@/shared/ui/Button";

import type { ChangeEvent, DragEvent, ReactNode } from "react";

type UploadAreaProps = {
  accept: string;
  ariaLabel: string;
  onSelectFiles: (files: File[]) => void;
  isMultiple?: boolean;
  isDisabled?: boolean;
  isEmbedded?: boolean;
  children?: ReactNode;
};

const UploadArea = ({
  accept,
  ariaLabel,
  onSelectFiles,
  isMultiple = false,
  isDisabled = false,
  isEmbedded = false,
  children,
}: UploadAreaProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const selectFiles = (files: FileList | null) => {
    if (isDisabled || !files?.length) return;
    onSelectFiles(isMultiple ? Array.from(files) : [files[0]]);
  };

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    selectFiles(event.currentTarget.files);
    event.currentTarget.value = "";
  };

  const handleDragOver = (event: DragEvent<HTMLButtonElement>) => {
    event.preventDefault();
    if (!isDisabled) setIsDragging(true);
  };

  const handleDragLeave = (event: DragEvent<HTMLButtonElement>) => {
    event.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (event: DragEvent<HTMLButtonElement>) => {
    event.preventDefault();
    setIsDragging(false);
    selectFiles(event.dataTransfer.files);
  };

  return (
    <>
      <Button
        className={styles["upload-area"]}
        onClick={() => fileInputRef.current?.click()}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        data-dragging={isDragging && !isDisabled ? "true" : "false"}
        data-embedded={isEmbedded ? "true" : "false"}
        disabled={isDisabled}
        aria-label={ariaLabel}
      >
        {children ?? <UploadPrompt />}
      </Button>
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        multiple={isMultiple}
        disabled={isDisabled}
        onChange={handleInputChange}
        className={styles["file-input"]}
        aria-label={`${ariaLabel}のファイル選択`}
        tabIndex={-1}
      />
    </>
  );
};

export default UploadArea;
