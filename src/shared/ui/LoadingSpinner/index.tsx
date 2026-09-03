import styles from "./index.module.css";

const LoadingSpinner = () => {
  return (
    <output className={styles["loading-spinner"]} aria-label="読み込み中" />
  );
};

export default LoadingSpinner;
