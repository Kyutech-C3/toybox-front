import styles from "./index.module.css";

type PaperProps = {
  children: React.ReactNode;
};

export const Paper = ({ children }: PaperProps) => {
  return <div className={styles["papar"]}>{children}</div>;
};
