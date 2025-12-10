import styles from "./index.module.css";
import MarkdownEditor from "./MarkdownEditor";
import WorkDetailForm from "./WorkDetailForm";

const WorkEditor = () => {
  return (
    <div className={styles["work-editor-wrapper"]}>
      <WorkDetailForm />
      <MarkdownEditor />
    </div>
  );
};

export default WorkEditor;
