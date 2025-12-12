import styles from "./index.module.css";

const DraftToggleButton = () => {
  return (
    <div className={styles["draft-toggle-button-wrapper"]}>
      <label className={styles["toggle-button"]}>
        <input type="checkbox" className={styles["toggle-button-checkbox"]} />
      </label>
      <p>公開する</p>
    </div>
  );
};
export default DraftToggleButton;
