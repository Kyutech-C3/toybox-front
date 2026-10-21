import styles from "./index.module.css";

type DevBadgeProps = {
  color?: "default" | "on-primary";
};

const DevBadge = ({ color = "default" }: DevBadgeProps) => {
  if (!import.meta.env.DEV) return null;

  return (
    <span className={styles["dev-badge"]} data-color={color}>
      DEV
    </span>
  );
};

export default DevBadge;
