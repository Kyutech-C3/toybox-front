import { useWorkEditorStore } from "../../store/useWorkEditorStore";
import styles from "./index.module.css";

const DraftToggleButton = () => {
  const visibility = useWorkEditorStore((state) => state.current.visibility);
  const setVisibility = useWorkEditorStore((state) => state.setVisibility);
  const isPublished = visibility !== "draft";

  return (
    <div className={styles["draft-toggle-button-wrapper"]}>
      <label className={styles["toggle-button"]}>
        <input
          type="checkbox"
          className={styles["toggle-button-checkbox"]}
          checked={isPublished}
          onChange={(event) =>
            setVisibility(event.target.checked ? "private" : "draft")
          }
        />
      </label>
      <p>公開する</p>
    </div>
  );
};
export default DraftToggleButton;
