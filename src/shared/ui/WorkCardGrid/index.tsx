import styles from "./index.module.css";

import type { ReactNode } from "react";

type WorkCardGridProps = {
  children: ReactNode;
};

const WorkCardGrid = ({ children }: WorkCardGridProps) => {
  return <div className={styles["work-card-grid"]}>{children}</div>;
};

export default WorkCardGrid;
