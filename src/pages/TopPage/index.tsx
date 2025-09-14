import styles from "./index.module.css";

import Header from "@/features/Header";
import WorkIndex from "@/features/WorkIndex";

const TopPage = () => {
  return (
    <>
      <Header />
      <main className={styles["main-wrapper"]}>
        <WorkIndex />
      </main>
    </>
  );
};

export default TopPage;
