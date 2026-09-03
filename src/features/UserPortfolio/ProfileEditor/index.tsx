import { useId, useState } from "react";
import { mutate } from "swr";

import { updateUserProfile } from "../api/updateUserProfile";
import { getUserPortfolioSWRKey } from "../hook/useUserPortfolio";
import styles from "./index.module.css";

import { useAuthStore } from "@/features/auth/store/useAuthStore";
import { useUserStore } from "@/features/auth/store/useUserStore";
import Button from "@/shared/ui/Button";
import useToast from "@/shared/ui/Toast/hook/useToast";

import type { UserProfileData } from "../api/getUserProfile";

type ProfileEditorProps = {
  userProfile: UserProfileData;
  onClose: () => void;
};

const DISPLAY_NAME_MAX_LENGTH = 32;
const PROFILE_MAX_LENGTH = 500;

const ProfileEditor = ({ userProfile, onClose }: ProfileEditorProps) => {
  const displayNameID = useId();
  const profileID = useId();
  const accessToken = useAuthStore((state) => state.accessToken);
  const user = useUserStore((state) => state.user);
  const setUser = useUserStore((state) => state.setUser);
  const { showToast } = useToast();

  const [displayName, setDisplayName] = useState(userProfile.display_name);
  const [profile, setProfile] = useState(userProfile.profile);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const trimmedDisplayName = displayName.trim();
  const isSubmitDisabled =
    isSubmitting ||
    trimmedDisplayName.length === 0 ||
    trimmedDisplayName.length > DISPLAY_NAME_MAX_LENGTH ||
    profile.length > PROFILE_MAX_LENGTH;

  const handleSubmit = async () => {
    if (isSubmitDisabled || !accessToken) return;

    setIsSubmitting(true);
    try {
      await updateUserProfile({
        userProfile,
        displayName: trimmedDisplayName,
        profile,
        accessToken,
      });
      await mutate(
        getUserPortfolioSWRKey({ userID: userProfile.id, accessToken }),
      );
      if (user) setUser({ ...user, display_name: trimmedDisplayName });

      showToast({ message: "プロフィールを更新しました", severity: "success" });
      onClose();
    } catch {
      showToast({
        message: "プロフィールを更新できませんでした",
        severity: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      className={styles["profile-editor"]}
      onSubmit={(event) => {
        event.preventDefault();
        void handleSubmit();
      }}
    >
      <div className={styles["field"]}>
        <label className={styles["label"]} htmlFor={displayNameID}>
          表示名
        </label>
        <input
          id={displayNameID}
          className={styles["input"]}
          value={displayName}
          maxLength={DISPLAY_NAME_MAX_LENGTH}
          onChange={(event) => setDisplayName(event.target.value)}
        />
      </div>
      <div className={styles["field"]}>
        <label className={styles["label"]} htmlFor={profileID}>
          自己紹介
        </label>
        <textarea
          id={profileID}
          className={styles["textarea"]}
          value={profile}
          maxLength={PROFILE_MAX_LENGTH}
          rows={4}
          onChange={(event) => setProfile(event.target.value)}
        />
        <p className={styles["counter"]}>
          {profile.length}/{PROFILE_MAX_LENGTH}
        </p>
      </div>
      <div className={styles["actions"]}>
        <Button onClick={onClose} isDisabled={isSubmitting}>
          キャンセル
        </Button>
        <Button
          onClick={() => void handleSubmit()}
          isDisabled={isSubmitDisabled}
        >
          {isSubmitting ? "保存中..." : "保存する"}
        </Button>
      </div>
    </form>
  );
};

export default ProfileEditor;
