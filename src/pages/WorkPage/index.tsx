import { Suspense } from "react";
import { useParams } from "react-router-dom";

import styles from "./index.module.css";

import Header from "@/features/Header";
import WorkDetail from "@/features/WorkDetail";
import Paper from "@/shared/ui/Paper";

const WorkPage = () => {
  const { id } = useParams<{ id: string }>();

  if (!id) {
    return <div>作品がありません</div>;
  }

  return (
    <>
      <Header />
      <main className={styles["main-wrapper"]}>
        <Suspense fallback={<h2>読み込み中...</h2>}>
          <WorkDetail workID={id} />
        </Suspense>
      </main>
    </>
  );
};

export default WorkPage;
