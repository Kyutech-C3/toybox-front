import styles from "./index.module.css";

import type { ReactNode } from "react";

type PaperProps = {
  children: ReactNode;
  /** "read" は本文を読む列。--content-read-width で幅を抑える */
  width?: "default" | "read";
};

const Paper = ({ children, width = "default" }: PaperProps) => {
  return (
    <div className={styles["paper-wrapper"]} data-width={width}>
      {children}
    </div>
  );
};

export default Paper;
