import useUnsavedChangesGuard from "./hook/useUnsavedChangesGuard";
import useWorkEditorSetup from "./hook/useWorkEditorSetup";
import styles from "./index.module.css";
import MarkdownEditor from "./MarkdownEditor";
import PublishButtons from "./PublishButtons";
import { useWorkEditorStore } from "./store/useWorkEditorStore";
import WorkEditorStoreProvider from "./store/WorkEditorStoreProvider";
import WorkDetailForm from "./WorkDetailForm";

import Button from "@/shared/ui/Button";
import PageLoading from "@/shared/ui/PageLoading";
import PageMetadata from "@/shared/ui/PageMetadata";

type WorkEditorProps = {
  workID: string | null;
};

type WorkEditorContentProps = {
  workID: string | null;
};

const WorkEditorContent = ({ workID }: WorkEditorContentProps) => {
  const { status } = useWorkEditorSetup({ workID });
  const isSubmitting = useWorkEditorStore((state) => state.isSubmitting);
  useUnsavedChangesGuard();

  if (status === "forbidden") {
    return (
      <section className={styles["editor-status"]}>
        <PageMetadata
          title="この作品は編集できません"
          description="編集できるのは作品を投稿した本人だけです。"
        />
        <h1>この作品は編集できません</h1>
        <p>編集できるのは作品を投稿した本人だけです。</p>
      </section>
    );
  }

  if (status === "error") {
    return (
      <section className={styles["editor-status"]} role="alert">
        <PageMetadata
          title="ユーザー情報を取得できませんでした"
          description="通信環境を確認して、ページを再読み込みしてください。"
        />
        <h1>ユーザー情報を取得できませんでした</h1>
        <p>通信環境を確認して、ページを再読み込みしてください。</p>
        <Button onClick={() => window.location.reload()}>再読み込み</Button>
      </section>
    );
  }

  if (status === "loading") return <PageLoading />;

  return (
    <div
      className={styles["work-editor-wrapper"]}
      inert={isSubmitting}
      aria-busy={isSubmitting}
    >
      <PageMetadata
        title={workID ? "作品を編集" : "作品を投稿"}
        description={
          workID
            ? "作品のタイトルや説明、アセットなどを編集します。"
            : "制作した作品をToyBoxに投稿できます。"
        }
      />
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
