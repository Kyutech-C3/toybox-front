import styles from "./index.module.css";

import type { ReactNode } from "react";

type PaperProps = {
  children: ReactNode;
};

const Paper = ({ children }: PaperProps) => {
  return <div className={styles["paper-wrapper"]}>{children}</div>;
};

export default Paper;
