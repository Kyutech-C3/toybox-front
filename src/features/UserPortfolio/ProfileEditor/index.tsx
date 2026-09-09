import { useId, useState } from "react";
import { mutate } from "swr";

import { updateUserProfile } from "../api/updateUserProfile";
import { getUserPortfolioSWRKey } from "../hook/useUserPortfolio";
import styles from "./index.module.css";

import { useAuthStore } from "@/features/auth/store/useAuthStore";
import { useUserStore } from "@/features/auth/store/useUserStore";
import Button from "@/shared/ui/Button";
import useToast from "@/shared/ui/Toast/hook/useToast";
import { normalizeInputText } from "@/util/normalizeInputText";

import type { UserProfileData } from "../api/getUserProfile";

type ProfileEditorProps = {
  userProfile: UserProfileData;
  onClose: () => void;
};

const DISPLAY_NAME_MAX_LENGTH = 32;
const PROFILE_MAX_LENGTH = 500;
const GITHUB_USERNAME_MAX_LENGTH = 39;
const X_USERNAME_MAX_LENGTH = 15;
const GITHUB_USERNAME_PATTERN = /^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/i;
const DISCARD_CONFIRM_MESSAGE =
  "保存していない変更があります。編集した内容を破棄しますか？";
const X_USERNAME_PATTERN = /^[a-z\d_]+$/i;

const normalizeSocialUsername = (username: string) =>
  normalizeInputText(username).replace(/^@/, "");

const getGithubError = (username: string) => {
  if (username === "") return "";
  if (username.length > GITHUB_USERNAME_MAX_LENGTH) {
    return `GitHub のユーザー名は${GITHUB_USERNAME_MAX_LENGTH}文字以内で入力してください`;
  }
  if (!GITHUB_USERNAME_PATTERN.test(username)) {
    return "GitHub のユーザー名には英数字と単独のハイフンのみ使用できます";
  }
  return "";
};

const getXError = (username: string) => {
  if (username === "") return "";
  if (username.length > X_USERNAME_MAX_LENGTH) {
    return `X のユーザー名は${X_USERNAME_MAX_LENGTH}文字以内で入力してください`;
  }
  if (!X_USERNAME_PATTERN.test(username)) {
    return "X のユーザー名には英数字とアンダースコアのみ使用できます";
  }
  return "";
};

const ProfileEditor = ({ userProfile, onClose }: ProfileEditorProps) => {
  const displayNameID = useId();
  const profileID = useId();
  const githubID = useId();
  const githubErrorID = useId();
  const xID = useId();
  const xErrorID = useId();
  const accessToken = useAuthStore((state) => state.accessToken);
  const user = useUserStore((state) => state.user);
  const setUser = useUserStore((state) => state.setUser);
  const { showToast } = useToast();

  const [displayName, setDisplayName] = useState(userProfile.display_name);
  const [profile, setProfile] = useState(userProfile.profile);
  const [github, setGithub] = useState(userProfile.github_id);
  const [xUsername, setXUsername] = useState(userProfile.twitter_id);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const trimmedDisplayName = displayName.trim();
  const normalizedGithubUsername = normalizeSocialUsername(github);
  const normalizedXUsername = normalizeSocialUsername(xUsername);
  const githubError = getGithubError(normalizedGithubUsername);
  const xError = getXError(normalizedXUsername);
  const isSubmitDisabled =
    isSubmitting ||
    trimmedDisplayName.length === 0 ||
    trimmedDisplayName.length > DISPLAY_NAME_MAX_LENGTH ||
    profile.length > PROFILE_MAX_LENGTH ||
    githubError !== "" ||
    xError !== "";

  const hasUnsavedChanges =
    trimmedDisplayName !== userProfile.display_name ||
    profile !== userProfile.profile ||
    normalizedGithubUsername !== userProfile.github_id ||
    normalizedXUsername !== userProfile.twitter_id;

  const handleCancel = () => {
    if (hasUnsavedChanges && !window.confirm(DISCARD_CONFIRM_MESSAGE)) return;

    onClose();
  };

  const handleSubmit = async () => {
    if (isSubmitDisabled || !accessToken) return;

    setIsSubmitting(true);
    try {
      await updateUserProfile({
        userProfile,
        displayName: trimmedDisplayName,
        profile,
        githubUsername: normalizedGithubUsername,
        xUsername: normalizedXUsername,
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
      <div className={styles["field"]}>
        <label className={styles["label"]} htmlFor={githubID}>
          GitHub
        </label>
        <div
          className={styles["social-input"]}
          data-invalid={githubError !== "" ? "true" : "false"}
        >
          <span className={styles["url-prefix"]}>https://github.com/</span>
          <input
            id={githubID}
            className={styles["social-id-input"]}
            value={github}
            placeholder="GitHub の ID"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            aria-invalid={githubError !== ""}
            aria-describedby={githubError !== "" ? githubErrorID : undefined}
            onChange={(event) => setGithub(event.target.value)}
            onBlur={() => setGithub(normalizedGithubUsername)}
          />
        </div>
        {githubError !== "" && (
          <span
            id={githubErrorID}
            className={styles["input-error"]}
            role="alert"
          >
            {githubError}
          </span>
        )}
      </div>
      <div className={styles["field"]}>
        <label className={styles["label"]} htmlFor={xID}>
          X
        </label>
        <div
          className={styles["social-input"]}
          data-invalid={xError !== "" ? "true" : "false"}
        >
          <span className={styles["url-prefix"]}>https://x.com/</span>
          <input
            id={xID}
            className={styles["social-id-input"]}
            value={xUsername}
            placeholder="X の ID"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            aria-invalid={xError !== ""}
            aria-describedby={xError !== "" ? xErrorID : undefined}
            onChange={(event) => setXUsername(event.target.value)}
            onBlur={() => setXUsername(normalizedXUsername)}
          />
        </div>
        {xError !== "" && (
          <span id={xErrorID} className={styles["input-error"]} role="alert">
            {xError}
          </span>
        )}
      </div>
      <div className={styles["actions"]}>
        <Button onClick={handleCancel} isDisabled={isSubmitting}>
          キャンセル
        </Button>
        <Button
          variant="accent"
          onClick={() => void handleSubmit()}
          isDisabled={isSubmitDisabled}
        >
          {isSubmitting ? "保存中..." : "保存"}
        </Button>
      </div>
    </form>
  );
};

export default ProfileEditor;
