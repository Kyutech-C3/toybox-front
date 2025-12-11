import styles from "./index.module.css";

import type { ReactNode } from "react";

type CardWrapperProps = {
  children: ReactNode;
};

const CardWrapper = ({ children }: CardWrapperProps) => {
  return <div className={styles["card-wrapper"]}>{children}</div>;
};

export default CardWrapper;
