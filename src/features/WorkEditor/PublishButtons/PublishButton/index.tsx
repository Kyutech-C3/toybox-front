import { useState } from "react";
import { useNavigate } from "react-router-dom";
import ArrowDropUpRoundedIcon from "@mui/icons-material/ArrowDropUpRounded";

import { postWork } from "../../api/postWork";
import { usePostWorkStore } from "../../store/usePostWorkStore";
import styles from "./index.module.css";

import { useAuthStore } from "@/features/auth/store/useAuthStore";
import Button from "@/shared/ui/Button";
import Dropdown from "@/shared/ui/Dropdown";

const PublishButton = () => {
  const {
    visibility,
    asset_ids,
    tag_ids,
    description,
    title,
    urls,
    setVisibility,
  } = usePostWorkStore();
  const { accessToken } = useAuthStore();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handlePublish = () => {
    if (!accessToken) {
      throw new Error("No access token available");
    }
    const response = postWork(
      {
        asset_ids,
        description,
        tag_ids,
        title,
        thumbnail_asset_id: asset_ids[0],
        urls,
        visibility,
      },
      accessToken,
    );

    if (response !== null) {
      navigate("/");
    }
  };

  return (
    <div className={styles["publish-button-wrapper"]}>
      {visibility === "draft" ? (
        <Button variant="primary" onClick={handlePublish}>
          下書き保存
        </Button>
      ) : (
        <>
          <button
            type="button"
            className={styles["publish-button"]}
            onClick={handlePublish}
          >
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
