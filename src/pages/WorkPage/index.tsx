import { useParams } from "react-router-dom";

import styles from "./index.module.css";

import CommentSection from "@/features/CommentSection";
import Header from "@/features/Header";

const WorkPage = () => {
  const { id } = useParams<{ id: string }>();

  return (
    <>
      <Header />
      <main className={styles["main-wrapper"]}>
        <CommentSection postId={id || "1"} />
      </main>
    </>
  );
};

export default WorkPage;
