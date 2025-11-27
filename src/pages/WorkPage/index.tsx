import { useParams } from "react-router-dom";

import styles from "./index.module.css";

import CommentSection from "@/features/CommentSection";
import Header from "@/features/Header";
import { Paper } from "@/shared/ui/Paper";

const WorkPage = () => {
  const { id } = useParams<{ id: string }>();

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
