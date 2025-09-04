import type { ReactNode } from "react";
import styles from "./index.module.css";

type BatchProps = {
  children: ReactNode;
};

const Batch = ({ children }: BatchProps) => {
  return <span className={styles["batch"]}>{children}</span>;
};

export default Batch;
