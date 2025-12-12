import { useState } from "react";
import ArrowDropUpRoundedIcon from "@mui/icons-material/ArrowDropUpRounded";

import { usePostWorkStore } from "../../store/usePostWorkStore";
import styles from "./index.module.css";

import Button from "@/shared/ui/Button";
import Dropdown from "@/shared/ui/Dropdown";

const PublishButton = () => {
  const { visibility, setVisibility } = usePostWorkStore();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handlePublish = () => {
    // 公開処理をここに実装
  };

  return (
    <div className={styles["publish-button-wrapper"]}>
      {visibility === "draft" ? (
        <Button variant="primary" onClick={handlePublish}>
          下書き保存
        </Button>
      ) : (
        <>
          <button type="button" className={styles["publish-button"]}>
            {visibility === "private" ? "限定公開" : "全体公開"}
          </button>
          <span className={styles["button-span"]} />
          <button
            type="button"
            className={styles["menu-button"]}
            onClick={() => setIsMenuOpen((prev) => !prev)}
          >
            <ArrowDropUpRoundedIcon />
          </button>
          <span className={styles["menu-button-span"]}>
            <Dropdown
              isOpen={isMenuOpen}
              options={["全体公開", "限定公開"]}
              onSelect={(value) => {
                setIsMenuOpen(false);
                setVisibility(value === "限定公開" ? "private" : "public");
              }}
              selectedValues={
                visibility === "private" ? ["限定公開"] : ["全体公開"]
              }
              position="top"
            />
          </span>
        </>
      )}
    </div>
  );
};
export default PublishButton;
