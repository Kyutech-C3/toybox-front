import styles from "./index.module.css";

import Header from "@/features/Header";

const WorkPage = () => {
  return (
    <>
      <Header />
      <main className={styles["main-wrapper"]}>
        <h1>WorkPage</h1>
      </main>
    </>
  );
};

export default WorkPage;
