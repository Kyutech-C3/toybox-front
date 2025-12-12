import { usePostWorkStore } from "../../store/usePostWorkStore";
import styles from "./index.module.css";

const DraftToggleButton = () => {
  const { setVisibility, visibility } = usePostWorkStore();
  return (
    <div className={styles["draft-toggle-button-wrapper"]}>
      <label className={styles["toggle-button"]}>
        <input
          type="checkbox"
          className={styles["toggle-button-checkbox"]}
          onChange={(e) =>
            setVisibility(e.target.checked ? "private" : "draft")
          }
          value={visibility === "draft" ? "" : "private"}
        />
      </label>
      <p>公開する</p>
    </div>
  );
};
export default DraftToggleButton;
