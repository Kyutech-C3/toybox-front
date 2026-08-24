import { useEffect, useRef } from "react";

import useWorkDetail from "../WorkDetail/hook/useWorkDetail";
import styles from "./index.module.css";
import MarkdownEditor from "./MarkdownEditor";
import PublishButtons from "./PublishButtons";
import { usePostWorkStore } from "./store/usePostWorkStore";
import WorkDetailForm from "./WorkDetailForm";

type WorkEditorProps = {
  workID?: string;
};

const WorkEditor = ({ workID }: WorkEditorProps) => {
  const { data, error } = useWorkDetail({ id: workID });
  const setUrls = usePostWorkStore((state) => state.setUrls);
  const isStoreInitializedRef = useRef(false);

  useEffect(() => {
    if (isStoreInitializedRef.current) return;
    isStoreInitializedRef.current = true;
    setUrls(data?.urls ?? []);
  }, [data, setUrls]);

  if (error) {
    return <div>エラー: {error.message}</div>;
  }

  return (
    <div className={styles["work-editor-wrapper"]}>
      <WorkDetailForm />
      <MarkdownEditor />
      <PublishButtons />
    </div>
  );
};

export default WorkEditor;
