import { useLayoutEffect, useRef, useState } from "react";

type MarkdownHistoryEntry = {
  value: string;
  selectionStart: number;
  selectionEnd: number;
};

type MarkdownHistoryState = {
  sessionVersion: number;
  entries: MarkdownHistoryEntry[];
  index: number;
  lastInputType: string;
  lastInputAt: number;
};

type UseMarkdownHistoryParams = {
  description: string;
  sessionVersion: number;
};

type UseMarkdownHistoryReturn = {
  canUndo: boolean;
  canRedo: boolean;
  record: (entry: MarkdownHistoryEntry, inputType: string) => void;
  updateSelection: (selectionStart: number, selectionEnd: number) => void;
  undo: () => MarkdownHistoryEntry | null;
  redo: () => MarkdownHistoryEntry | null;
};

const MAX_HISTORY_ENTRIES = 100;
const TYPING_GROUP_MS = 750;

const createHistory = (
  description: string,
  sessionVersion: number,
): MarkdownHistoryState => ({
  sessionVersion,
  entries: [
    {
      value: description,
      selectionStart: description.length,
      selectionEnd: description.length,
    },
  ],
  index: 0,
  lastInputType: "",
  lastInputAt: 0,
});

const appendEntry = (
  history: MarkdownHistoryState,
  entry: MarkdownHistoryEntry,
) => {
  history.entries = [...history.entries.slice(0, history.index + 1), entry];
  if (history.entries.length > MAX_HISTORY_ENTRIES) history.entries.shift();
  history.index = history.entries.length - 1;
};

const useMarkdownHistory = ({
  description,
  sessionVersion,
}: UseMarkdownHistoryParams): UseMarkdownHistoryReturn => {
  const historyRef = useRef<MarkdownHistoryState | null>(null);
  if (!historyRef.current) {
    historyRef.current = createHistory(description, sessionVersion);
  }
  const [, setRevision] = useState(0);

  useLayoutEffect(() => {
    const history = historyRef.current;
    if (!history) return;
    if (history.sessionVersion !== sessionVersion) {
      historyRef.current = createHistory(description, sessionVersion);
      setRevision((current) => current + 1);
      return;
    }
    if (history.entries[history.index].value !== description) {
      // アセット削除など、本文以外の操作で変わった値は履歴の新しい起点にする。
      // 以前の画像参照を Undo で復活させると、削除済みアセットを指してしまう。
      historyRef.current = createHistory(description, sessionVersion);
      setRevision((current) => current + 1);
    }
  }, [description, sessionVersion]);

  const record = (entry: MarkdownHistoryEntry, inputType: string) => {
    const history = historyRef.current;
    if (!history) return;
    const previous = history.entries[history.index];
    if (previous.value === entry.value) return;

    if (inputType === "historyUndo" && history.index > 0) {
      if (history.entries[history.index - 1].value === entry.value) {
        history.index -= 1;
        history.lastInputType = "";
        setRevision((current) => current + 1);
        return;
      }
    }
    if (
      inputType === "historyRedo" &&
      history.index < history.entries.length - 1
    ) {
      if (history.entries[history.index + 1].value === entry.value) {
        history.index += 1;
        history.lastInputType = "";
        setRevision((current) => current + 1);
        return;
      }
    }

    const now = Date.now();
    const isConsecutiveTyping =
      inputType === "insertText" &&
      history.lastInputType === inputType &&
      now - history.lastInputAt < TYPING_GROUP_MS &&
      history.index === history.entries.length - 1 &&
      entry.value.length === previous.value.length + 1 &&
      previous.selectionStart === previous.selectionEnd &&
      entry.selectionStart === entry.selectionEnd &&
      entry.selectionStart === previous.selectionEnd + 1;
    if (isConsecutiveTyping) {
      history.entries[history.index] = entry;
    } else {
      appendEntry(history, entry);
    }
    history.lastInputType = inputType;
    history.lastInputAt = now;
    setRevision((current) => current + 1);
  };

  const updateSelection = (selectionStart: number, selectionEnd: number) => {
    const history = historyRef.current;
    if (!history) return;
    const current = history.entries[history.index];
    if (
      current.selectionStart !== selectionStart ||
      current.selectionEnd !== selectionEnd
    ) {
      history.lastInputType = "";
    }
    history.entries[history.index] = {
      ...current,
      selectionStart,
      selectionEnd,
    };
  };

  const undo = (): MarkdownHistoryEntry | null => {
    const history = historyRef.current;
    if (!history || history.index === 0) return null;
    history.index -= 1;
    history.lastInputType = "";
    setRevision((current) => current + 1);
    return history.entries[history.index];
  };

  const redo = (): MarkdownHistoryEntry | null => {
    const history = historyRef.current;
    if (!history || history.index >= history.entries.length - 1) return null;
    history.index += 1;
    history.lastInputType = "";
    setRevision((current) => current + 1);
    return history.entries[history.index];
  };

  const history = historyRef.current;
  return {
    canUndo: history.index > 0,
    canRedo: history.index < history.entries.length - 1,
    record,
    updateSelection,
    undo,
    redo,
  };
};

export default useMarkdownHistory;
