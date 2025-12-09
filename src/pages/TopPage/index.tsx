import { Suspense } from "react";

import styles from "./index.module.css";

import Header from "@/features/Header";
import WorkIndex from "@/features/WorkIndex";

const TopPage = () => {
  return (
    <>
      <Header />
      <main className={styles["main-wrapper"]}>
        <Suspense fallback={<h2>読み込み中...</h2>}>
          <WorkIndex />
        </Suspense>
      </main>
    </>
  );
};

export default TopPage;
