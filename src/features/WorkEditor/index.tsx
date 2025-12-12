import styles from "./index.module.css";
import MarkdownEditor from "./MarkdownEditor";
import PublishButtons from "./PublishButtons";
import WorkDetailForm from "./WorkDetailForm";

const WorkEditor = () => {
  return (
    <div className={styles["work-editor-wrapper"]}>
      <WorkDetailForm />
      <MarkdownEditor />
      <PublishButtons />
    </div>
  );
};

export default WorkEditor;
