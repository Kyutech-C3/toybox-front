import styles from "./index.module.css";

import type React from "react";

interface SendButtonProps {
  onClick?: () => void;
  disabled?: boolean;
}

const SendButton: React.FC<SendButtonProps> = ({ onClick, disabled }) => {
  return (
    <button
      className={styles.sendButton}
      type="button"
      onClick={onClick}
      disabled={disabled}
    >
      送信
    </button>
  );
};

export default SendButton;
