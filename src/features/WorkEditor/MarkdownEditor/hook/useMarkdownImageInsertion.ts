import { useLayoutEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";

import { getExtension } from "../../editorAsset";
import {
  useWorkEditorStore,
  useWorkEditorStoreApi,
} from "../../store/useWorkEditorStore";
import useAssetUpload, {
  IMAGE_ASSET_ACCEPT,
} from "../../WorkDetailForm/hook/useAssetUpload";
import { getAssetImageMarkdown } from "../MarkdownImagePicker";

import type { ICommand } from "@uiw/react-md-editor";
import type {
  ChangeEvent,
  ClipboardEvent,
  DragEvent,
  RefObject,
  SyntheticEvent,
} from "react";
import type { EditorAsset } from "../../types";

const CLIPBOARD_IMAGE_EXTENSIONS: Record<string, string[]> = {
  "image/png": [".png"],
  "image/jpeg": [".jpg", ".jpeg"],
  "image/bmp": [".bmp"],
  "image/gif": [".gif"],
  "image/webp": [".webp"],
};

type ImageInsertionSelection = {
  textarea: HTMLTextAreaElement;
  start: number;
  end: number;
  description: string;
  sessionVersion: number;
};

type PendingInsertion = {
  selectionStart: number;
  selectionEnd: number;
  pageX: number;
  pageY: number;
  sourceScrollTop: number | null;
  previewScrollTop: number | null;
  textareaScrollTop: number | null;
};

type UseMarkdownImageInsertionParams = {
  editorRef: RefObject<HTMLDivElement | null>;
  sourceRef: RefObject<HTMLDivElement | null>;
  previewRef: RefObject<HTMLDivElement | null>;
};

type UseMarkdownImageInsertionReturn = {
  fileInputRef: RefObject<HTMLInputElement | null>;
  images: EditorAsset[];
  selectedImage: EditorAsset | undefined;
  setSelectedImageKey: (key: string) => void;
  imageInsertNotice: string;
  clearImageInsertNotice: () => void;
  handleTextSelection: (event: SyntheticEvent<HTMLTextAreaElement>) => void;
  handleInsertImage: (markdown: string) => boolean;
  handleImageFileChange: (event: ChangeEvent<HTMLInputElement>) => void;
  handleImagePaste: (event: ClipboardEvent<HTMLTextAreaElement>) => void;
  handleImageDragOver: (event: DragEvent<HTMLTextAreaElement>) => void;
  handleImageDrop: (event: DragEvent<HTMLTextAreaElement>) => void;
  handleCommandFilter: (command: ICommand, isExtra: boolean) => ICommand;
};

const isInsertableImage = (asset: EditorAsset) => {
  if (asset.kind !== "画像" || asset.status !== "success" || !asset.assetURL)
    return false;
  try {
    const protocol = new URL(asset.assetURL).protocol;
    return protocol === "https:" || protocol === "http:";
  } catch {
    return false;
  }
};

const useMarkdownImageInsertion = ({
  editorRef,
  sourceRef,
  previewRef,
}: UseMarkdownImageInsertionParams): UseMarkdownImageInsertionReturn => {
  const assets = useWorkEditorStore((state) => state.current.assets);
  const setDescription = useWorkEditorStore((state) => state.setDescription);
  const editorStore = useWorkEditorStoreApi();
  const { handleAddImageFile } = useAssetUpload();
  const [selectedImageKey, setSelectedImageKey] = useState("");
  const [imageInsertNotice, setImageInsertNotice] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadSelectionRef = useRef<ImageInsertionSelection | null>(null);
  const pendingInsertionRef = useRef<PendingInsertion | null>(null);
  const images = assets.filter(isInsertableImage);
  const selectedImage =
    images.find((asset) => asset.key === selectedImageKey) ?? images[0];

  useLayoutEffect(() => {
    const pending = pendingInsertionRef.current;
    if (!pending) return;
    const textarea = editorRef.current?.querySelector<HTMLTextAreaElement>(
      ".w-md-editor-text-input",
    );
    if (!textarea) return;
    textarea.setSelectionRange(pending.selectionStart, pending.selectionEnd);
    textarea.focus({ preventScroll: true });
    if (pending.textareaScrollTop !== null) {
      textarea.scrollTop = pending.textareaScrollTop;
    }
    if (pending.sourceScrollTop !== null && sourceRef.current) {
      sourceRef.current.scrollTop = pending.sourceScrollTop;
    }
    if (pending.previewScrollTop !== null && previewRef.current) {
      previewRef.current.scrollTop = pending.previewScrollTop;
    }
    window.scrollTo(pending.pageX, pending.pageY);
    textareaRef.current = textarea;
    pendingInsertionRef.current = null;
  });

  const handleTextSelection = (event: SyntheticEvent<HTMLTextAreaElement>) => {
    textareaRef.current = event.currentTarget;
  };

  const insertImage = (
    markdown: string,
    savedSelection?: ImageInsertionSelection,
  ) => {
    const hasActiveTextarea = textareaRef.current?.isConnected ?? false;
    const textarea = savedSelection?.textarea?.isConnected
      ? savedSelection.textarea
      : hasActiveTextarea
        ? textareaRef.current
        : editorRef.current?.querySelector<HTMLTextAreaElement>(
            ".w-md-editor-text-input",
          );
    if (!textarea) return false;
    const previousValue = textarea.value;
    const currentDescription = editorStore.getState().current.description;
    const selection = savedSelection
      ? { start: savedSelection.start, end: savedSelection.end }
      : hasActiveTextarea
        ? { start: textarea.selectionStart, end: textarea.selectionEnd }
        : { start: currentDescription.length, end: currentDescription.length };
    const start = Math.min(selection.start, currentDescription.length);
    const end = Math.min(selection.end, currentDescription.length);
    const nextCaretPosition = start + markdown.length;
    pendingInsertionRef.current = {
      selectionStart: nextCaretPosition,
      selectionEnd: nextCaretPosition,
      pageX: window.scrollX,
      pageY: window.scrollY,
      sourceScrollTop: sourceRef.current?.scrollTop ?? null,
      previewScrollTop: previewRef.current?.scrollTop ?? null,
      textareaScrollTop: textarea.scrollTop,
    };
    textarea.focus({ preventScroll: true });
    textarea.setSelectionRange(start, end);
    let didInsert = false;
    try {
      didInsert = document.execCommand("insertText", false, markdown);
    } catch {
      // 入力コマンドを使えない環境でも挿入は続ける
    }
    if (!didInsert) textarea.setRangeText(markdown, start, end, "end");
    flushSync(() => setDescription(textarea.value));
    textareaRef.current = textarea;
    return textarea.value !== previousValue;
  };

  const insertImageRef = useRef(insertImage);
  insertImageRef.current = insertImage;
  const captureImageSelection = (textarea: HTMLTextAreaElement) => ({
    textarea,
    start: textarea.selectionStart,
    end: textarea.selectionEnd,
    description: editorStore.getState().current.description,
    sessionVersion: editorStore.getState().sessionVersion,
  });
  const handleOpenImagePicker = () => {
    const textarea = editorRef.current?.querySelector<HTMLTextAreaElement>(
      ".w-md-editor-text-input",
    );
    if (!textarea) return;
    setImageInsertNotice("");
    uploadSelectionRef.current = captureImageSelection(textarea);
    fileInputRef.current?.click();
  };
  const openImagePickerRef = useRef(handleOpenImagePicker);
  openImagePickerRef.current = handleOpenImagePicker;
  const uploadAndInsertImages = async (
    files: File[],
    selection: ImageInsertionSelection,
  ) => {
    if (files.length === 0) return;
    if (selection.sessionVersion !== editorStore.getState().sessionVersion)
      return;
    setImageInsertNotice("");
    const uploaded = await Promise.all(files.map(handleAddImageFile));
    if (selection.sessionVersion !== editorStore.getState().sessionVersion)
      return;
    const images = uploaded.filter((asset): asset is EditorAsset =>
      Boolean(asset?.assetURL),
    );
    if (images.length === 0) return;
    setSelectedImageKey(images[images.length - 1].key);
    const markdown = images.map(getAssetImageMarkdown).join("\n");
    const isDescriptionUnchanged =
      editorStore.getState().current.description === selection.description;
    insertImage(markdown, isDescriptionUnchanged ? selection : undefined);
  };
  const handleImageFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.currentTarget.files ?? []);
    event.currentTarget.value = "";
    const selection = uploadSelectionRef.current;
    uploadSelectionRef.current = null;
    if (selection)
      queueMicrotask(() => uploadAndInsertImages(files, selection));
  };
  const handleImagePaste = (event: ClipboardEvent<HTMLTextAreaElement>) => {
    const clipboard = event.clipboardData;
    if (
      clipboard.getData("text/plain") ||
      Array.from(clipboard.items).some(
        (item) => item.kind === "string" && item.type === "text/plain",
      )
    )
      return;
    const itemImages = Array.from(clipboard.items)
      .filter((item) => item.kind === "file" && item.type.startsWith("image/"))
      .flatMap((item) => {
        const file = item.getAsFile();
        return file ? [file] : [];
      });
    const images = itemImages.length
      ? itemImages
      : Array.from(clipboard.files).filter((file) =>
          file.type.startsWith("image/"),
        );
    if (images.length === 0) return;
    event.preventDefault();
    const files = images.map((image, index) => {
      const extensions = CLIPBOARD_IMAGE_EXTENSIONS[image.type];
      if (!extensions || extensions.includes(getExtension(image.name)))
        return image;
      return new File(
        [image],
        `clipboard-${Date.now()}-${index + 1}${extensions[0]}`,
        { type: image.type },
      );
    });
    const selection = captureImageSelection(event.currentTarget);
    queueMicrotask(() => uploadAndInsertImages(files, selection));
  };
  const handleImageDragOver = (event: DragEvent<HTMLTextAreaElement>) => {
    if (Array.from(event.dataTransfer.types).includes("Files"))
      event.preventDefault();
  };
  const handleImageDrop = (event: DragEvent<HTMLTextAreaElement>) => {
    if (
      !Array.from(event.dataTransfer.types).includes("Files") &&
      event.dataTransfer.files.length === 0
    )
      return;
    event.preventDefault();
    const files = Array.from(event.dataTransfer.files).filter(
      (file) =>
        file.type.startsWith("image/") ||
        IMAGE_ASSET_ACCEPT.split(",").includes(getExtension(file.name)),
    );
    const selection = captureImageSelection(event.currentTarget);
    queueMicrotask(() => uploadAndInsertImages(files, selection));
  };
  const handleCommandFilter = (
    command: ICommand,
    isExtra: boolean,
  ): ICommand => {
    if (isExtra || command.name !== "image") return command;
    return {
      ...command,
      buttonProps: {
        ...command.buttonProps,
        "aria-label": "画像を選んで挿入",
        title: "画像を選んで挿入",
      },
      execute: () => openImagePickerRef.current(),
    };
  };

  return {
    fileInputRef,
    images,
    selectedImage,
    setSelectedImageKey,
    imageInsertNotice,
    clearImageInsertNotice: () => setImageInsertNotice(""),
    handleTextSelection,
    handleInsertImage: (markdown) => insertImage(markdown),
    handleImageFileChange,
    handleImagePaste,
    handleImageDragOver,
    handleImageDrop,
    handleCommandFilter,
  };
};

export default useMarkdownImageInsertion;
