import styles from "./index.module.css";

type AvaterProps = {
  avaterURL?: string;
};

const Avater = ({ avaterURL = "./comingSoonLugia.webp" }: AvaterProps) => {
  return (
    <img
      src={avaterURL}
      className={styles["avater-image"]}
      height={46}
      width={46}
    />
  );
};

export default Avater;
