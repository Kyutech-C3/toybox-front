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
const GITHUB_USERNAME_MAX_LENGTH = 39;
const TWITTER_USERNAME_MAX_LENGTH = 15;
const GITHUB_USERNAME_PATTERN = /^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/i;
const TWITTER_USERNAME_PATTERN = /^[a-z\d_]+$/i;

const normalizeSocialUsername = (username: string) =>
  username.normalize("NFKC").trim().replace(/^@/, "");

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

const getTwitterError = (username: string) => {
  if (username === "") return "";
  if (username.length > TWITTER_USERNAME_MAX_LENGTH) {
    return `Twitter のユーザー名は${TWITTER_USERNAME_MAX_LENGTH}文字以内で入力してください`;
  }
  if (!TWITTER_USERNAME_PATTERN.test(username)) {
    return "Twitter のユーザー名には英数字とアンダースコアのみ使用できます";
  }
  return "";
};

const ProfileEditor = ({ userProfile, onClose }: ProfileEditorProps) => {
  const displayNameID = useId();
  const profileID = useId();
  const githubID = useId();
  const githubErrorID = useId();
  const twitterID = useId();
  const twitterErrorID = useId();
  const accessToken = useAuthStore((state) => state.accessToken);
  const user = useUserStore((state) => state.user);
  const setUser = useUserStore((state) => state.setUser);
  const { showToast } = useToast();

  const [displayName, setDisplayName] = useState(userProfile.display_name);
  const [profile, setProfile] = useState(userProfile.profile);
  const [github, setGithub] = useState(userProfile.github_id);
  const [twitter, setTwitter] = useState(userProfile.twitter_id);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const trimmedDisplayName = displayName.trim();
  const normalizedGithub = normalizeSocialUsername(github);
  const normalizedTwitter = normalizeSocialUsername(twitter);
  const githubError = getGithubError(normalizedGithub);
  const twitterError = getTwitterError(normalizedTwitter);
  const isSubmitDisabled =
    isSubmitting ||
    trimmedDisplayName.length === 0 ||
    trimmedDisplayName.length > DISPLAY_NAME_MAX_LENGTH ||
    profile.length > PROFILE_MAX_LENGTH ||
    githubError !== "" ||
    twitterError !== "";

  const handleSubmit = async () => {
    if (isSubmitDisabled || !accessToken) return;

    setIsSubmitting(true);
    try {
      await updateUserProfile({
        userProfile,
        displayName: trimmedDisplayName,
        profile,
        githubID: normalizedGithub,
        twitterID: normalizedTwitter,
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
            onBlur={() => setGithub(normalizedGithub)}
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
        <label className={styles["label"]} htmlFor={twitterID}>
          Twitter
        </label>
        <div
          className={styles["social-input"]}
          data-invalid={twitterError !== "" ? "true" : "false"}
        >
          <span className={styles["url-prefix"]}>https://twitter.com/</span>
          <input
            id={twitterID}
            className={styles["social-id-input"]}
            value={twitter}
            placeholder="Twitter の ID"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            aria-invalid={twitterError !== ""}
            aria-describedby={twitterError !== "" ? twitterErrorID : undefined}
            onChange={(event) => setTwitter(event.target.value)}
            onBlur={() => setTwitter(normalizedTwitter)}
          />
        </div>
        {twitterError !== "" && (
          <span
            id={twitterErrorID}
            className={styles["input-error"]}
            role="alert"
          >
            {twitterError}
          </span>
        )}
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
