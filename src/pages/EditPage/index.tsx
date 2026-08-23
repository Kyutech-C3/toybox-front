import { useLayoutEffect } from "react";

import styles from "./index.module.css";

import Header from "@/features/Header";
import WorkEditor from "@/features/WorkEditor";
import { usePostWorkStore } from "@/features/WorkEditor/store/usePostWorkStore";

type EditPageProps = {
  isNewWork?: boolean;
};

const EditPage = ({ isNewWork = false }: EditPageProps) => {
  const resetPostWork = usePostWorkStore((state) => state.resetPostWork);

  useLayoutEffect(() => {
    if (isNewWork) resetPostWork();
  }, [isNewWork, resetPostWork]);

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
