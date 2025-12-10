import styles from "./index.module.css";

import Header from "@/features/Header";
import WorkEditor from "@/features/WorkEditor";
import MarkdownEditor from "@/features/WorkEditor/MarkdownEditor";

const EditPage = () => {
  return (
    <>
      <Header />
      <main className={styles["main-wrapper"]}>
        <h1>EditPage</h1>
        <WorkEditor />
      </main>
    </>
  );
};

export default EditPage;
