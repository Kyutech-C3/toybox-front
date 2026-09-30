import styles from "./index.module.css";

type LoadingSpinnerProps = {
  isDecorative?: boolean;
  size?: "default" | "small";
};

const LoadingSpinner = ({
  size = "default",
  isDecorative = false,
}: LoadingSpinnerProps) => {
  return (
    <output
      className={styles["loading-spinner"]}
      aria-label={isDecorative ? undefined : "読み込み中"}
      aria-hidden={isDecorative || undefined}
      data-size={size}
    />
  );
};

export default LoadingSpinner;
