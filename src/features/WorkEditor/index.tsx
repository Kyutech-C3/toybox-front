import useWorkEditorSetup from "./hook/useWorkEditorSetup";
import styles from "./index.module.css";
import MarkdownEditor from "./MarkdownEditor";
import PublishButtons from "./PublishButtons";
import WorkDetailForm from "./WorkDetailForm";

import PageLoading from "@/shared/ui/PageLoading";

type WorkEditorProps = {
  /** 新規投稿なら null、編集なら対象作品の ID */
  workID: string | null;
};

const WorkEditor = ({ workID }: WorkEditorProps) => {
  const { status } = useWorkEditorSetup({ workID });

  if (status === "forbidden") {
    return (
      <section className={styles["editor-status"]}>
        <h1>この作品は編集できません</h1>
        <p>編集できるのは作品を投稿した本人だけです。</p>
      </section>
    );
  }

  if (status === "loading") return <PageLoading />;

  return (
    <>
      <h1 className={styles["editor-heading"]}>
        {workID === null ? "作品を投稿" : "作品を編集"}
      </h1>
      <div className={styles["work-editor-wrapper"]}>
        <WorkDetailForm />
        <MarkdownEditor />
        <PublishButtons />
      </div>
    </>
  );
};

export default WorkEditor;

export { getWorkEditorSWRKey } from "./hook/useWorkForEdit";
