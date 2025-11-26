import styles from "./index.module.css";

type ButtonVariant = "nav" | "page" | "dots";

interface ButtonProps {
  variant?: ButtonVariant;
  active?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
  ariaLabel?: string;
}

export const PagenationButton = ({
  variant = "page",
  active = false,
  disabled = false,
  onClick,
  children,
  ariaLabel,
}: ButtonProps) => {
  const getClassName = () => {
    const baseClass = styles[`${variant}-button`];
    if (variant === "page" && active) {
      return `${baseClass} ${styles["page-button--active"]}`;
    }
    if (disabled) {
      return `${baseClass} ${styles.disabled}`;
    }
    return baseClass;
  };

  return (
    <button
      type="button"
      className={getClassName()}
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
    >
      {children}
    </button>
  );
};
