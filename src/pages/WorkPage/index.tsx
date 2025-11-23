import styles from "./index.module.css";

import Header from "@/features/Header";
import { Paper } from "@/shared/ui/Paper";

const WorkPage = () => {
  return (
    <>
      <Header />
      <main className={styles["main-wrapper"]}>
        <Paper>
          <h1>WorkPage</h1>
        </Paper>
      </main>
    </>
  );
};

export default WorkPage;
