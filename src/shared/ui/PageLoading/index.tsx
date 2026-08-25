import styles from "./index.module.css";

const PageLoading = () => {
  return (
    <section className={styles["page-loading"]} aria-live="polite">
      <h2>読み込み中...</h2>
    </section>
  );
};

export default PageLoading;
