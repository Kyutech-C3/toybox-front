import styles from "./index.module.css";

import Header from "@/features/Header";
import MarkdownEditor from "@/features/MarkdownEditor";

const EditPage = () => {
  return (
    <>
      <Header />
      <main className={styles["main-wrapper"]}>
        <h1>EditPage</h1>
        <MarkdownEditor />
      </main>
    </>
  );
};

export default EditPage;
