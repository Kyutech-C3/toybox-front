import styles from "./index.module.css";

type PageLoadingProps = {
  layout?: "page" | "section";
};

const PageLoading = ({ layout = "page" }: PageLoadingProps) => {
  return (
    <section
      className={styles["page-loading"]}
      data-layout={layout}
      aria-live="polite"
    >
      <h2>読み込み中...</h2>
    </section>
  );
};

export default PageLoading;
