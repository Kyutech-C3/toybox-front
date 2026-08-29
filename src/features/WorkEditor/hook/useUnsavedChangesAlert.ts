import { useEffect } from "react";

type UseUnsavedChangesAlertParams = {
  isEnabled: boolean;
};

type UseUnsavedChangesAlertReturn = undefined;

// リロードとタブを閉じる操作に対してブラウザ標準の確認ダイアログを出す。
// アプリ内遷移は beforeunload では発火しないため、別途 useBlocker が要る。
const useUnsavedChangesAlert = ({
  isEnabled,
}: UseUnsavedChangesAlertParams): UseUnsavedChangesAlertReturn => {
  useEffect(() => {
    if (!isEnabled) return;

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [isEnabled]);
};

export default useUnsavedChangesAlert;
