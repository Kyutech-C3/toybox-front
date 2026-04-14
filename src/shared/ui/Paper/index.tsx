import styles from "./index.module.css";

type PaperProps = {
  children: React.ReactNode;
};

const Paper = ({ children }: PaperProps) => {
  return <div className={styles["paper-wrapper"]}>{children}</div>;
};

export default Paper;
