import useUnsavedChangesGuard from "./hook/useUnsavedChangesGuard";
import useWorkEditorSetup from "./hook/useWorkEditorSetup";
import styles from "./index.module.css";
import MarkdownEditor from "./MarkdownEditor";
import PublishButtons from "./PublishButtons";
import WorkEditorStoreProvider from "./store/WorkEditorStoreProvider";
import WorkDetailForm from "./WorkDetailForm";

import Button from "@/shared/ui/Button";
import PageLoading from "@/shared/ui/PageLoading";

type WorkEditorProps = {
  workID: string | null;
};

type WorkEditorContentProps = {
  workID: string | null;
};

const WorkEditorContent = ({ workID }: WorkEditorContentProps) => {
  const { status } = useWorkEditorSetup({ workID });
  useUnsavedChangesGuard();

  if (status === "forbidden") {
    return (
      <section className={styles["editor-status"]}>
        <h1>この作品は編集できません</h1>
        <p>編集できるのは作品を投稿した本人だけです。</p>
      </section>
    );
  }

  if (status === "error") {
    return (
      <section className={styles["editor-status"]} role="alert">
        <h1>ユーザー情報を取得できませんでした</h1>
        <p>通信環境を確認して、ページを再読み込みしてください。</p>
        <Button onClick={() => window.location.reload()}>再読み込み</Button>
      </section>
    );
  }

  if (status === "loading") return <PageLoading />;

  return (
    <div className={styles["work-editor-wrapper"]}>
      <WorkDetailForm />
      <MarkdownEditor />
      <PublishButtons />
    </div>
  );
};

const WorkEditor = ({ workID }: WorkEditorProps) => {
  return (
    <WorkEditorStoreProvider key={workID ?? "new"}>
      <WorkEditorContent workID={workID} />
    </WorkEditorStoreProvider>
  );
};

export default WorkEditor;

export { isWorkEditorSWRKey } from "./hook/useWorkForEdit";
