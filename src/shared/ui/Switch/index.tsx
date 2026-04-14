import styles from "./index.module.css";

import type { Dispatch, SetStateAction } from "react";

type SwitchProp = {
  setIsToy: Dispatch<SetStateAction<boolean>>;
  isToy: boolean;
};

const Switch = ({ setIsToy, isToy }: SwitchProp) => {
  return (
    <div className={styles["buttons-wrapper"]}>
      <button
        type="button"
        onClick={() => setIsToy(true)}
        data-is-toy={isToy}
        className={styles["toy-button"]}
      >
        Toy
      </button>
      <button
        type="button"
        onClick={() => setIsToy(false)}
        data-is-toy={isToy}
        className={styles["blog-button"]}
      >
        Blog
      </button>
    </div>
  );
};

export default Switch;
