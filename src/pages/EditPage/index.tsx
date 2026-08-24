import { Suspense } from "react";
import { useParams } from "react-router-dom";

import styles from "./index.module.css";

import Header from "@/features/Header";
import WorkEditor from "@/features/WorkEditor";

const NEW_WORK_ID = "new";

const EditPage = () => {
  const { id } = useParams<{ id: string }>();

  return (
    <>
      <Header />
      <main className={styles["main-wrapper"]}>
        <Suspense fallback={<h2>読み込み中...</h2>}>
          <WorkEditor workID={id === NEW_WORK_ID ? undefined : id} />
        </Suspense>
      </main>
    </>
  );
};

export default EditPage;
