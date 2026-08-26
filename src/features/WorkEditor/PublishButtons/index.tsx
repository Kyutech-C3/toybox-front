import { useNavigate } from "react-router-dom";

import { useWorkEditorStore } from "../store/useWorkEditorStore";
import DraftToggleButton from "./DraftToggleButton";
import styles from "./index.module.css";
import PublishButton from "./PublishButton";

import DeleteWorkButton from "@/features/WorkDelete/DeleteWorkButton";

const PublishButtons = () => {
  const mode = useWorkEditorStore((state) => state.mode);
  const workID = useWorkEditorStore((state) => state.workID);
  const ownerID = useWorkEditorStore((state) => state.ownerID);
  const resetEditor = useWorkEditorStore((state) => state.resetEditor);
  const navigate = useNavigate();

  const handleDeleted = () => {
    // 作品自体が無くなるので、未保存確認には掛けずに離脱する
    resetEditor();
    navigate("/");
  };

  return (
    <div className={styles["publish-buttons-wrapper"]}>
      <DraftToggleButton />
      {mode === "edit" && workID && ownerID && (
        <DeleteWorkButton
          workID={workID}
          ownerID={ownerID}
          onDeleted={handleDeleted}
        />
      )}
      <PublishButton />
    </div>
  );
};
export default PublishButtons;
