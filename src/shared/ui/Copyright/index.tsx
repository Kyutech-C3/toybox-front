import styles from "./index.module.css";

type CopyrightProps = {
  className?: string;
};

const Copyright = ({ className }: CopyrightProps) => (
  <small className={[styles["copyright"], className].filter(Boolean).join(" ")}>
    © {new Date().getFullYear()} Composite Computer Club
  </small>
);

export default Copyright;
