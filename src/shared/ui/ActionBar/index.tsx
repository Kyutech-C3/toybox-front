import styles from "./index.module.css";

import type { ReactNode } from "react";

type ActionBarProps = {
  children: ReactNode;
};

const ActionBar = ({ children }: ActionBarProps) => (
  <div className={styles["action-bar"]}>
    <div className={styles["actions"]}>{children}</div>
  </div>
);

export default ActionBar;
