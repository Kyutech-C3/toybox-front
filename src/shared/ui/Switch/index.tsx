import styles from "./index.module.css";

type SwitchProps = {
  onChange: (isToy: boolean) => void;
  isToy: boolean;
};

const Switch = ({ onChange, isToy }: SwitchProps) => {
  return (
    <div className={styles["buttons-wrapper"]}>
      <button
        type="button"
        onClick={() => onChange(true)}
        data-is-toy={isToy}
        className={styles["toy-button"]}
      >
        Toy
      </button>
      <button
        type="button"
        onClick={() => onChange(false)}
        data-is-toy={isToy}
        className={styles["blog-button"]}
      >
        Blog
      </button>
    </div>
  );
};

export default Switch;
