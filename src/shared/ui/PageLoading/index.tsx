import styles from "./index.module.css";

import LoadingSpinner from "@/shared/ui/LoadingSpinner";

type PageLoadingProps = {
  layout?: "page" | "section";
};

const PageLoading = ({ layout = "page" }: PageLoadingProps) => {
  return (
    <section className={styles["page-loading"]} data-layout={layout}>
      <LoadingSpinner />
    </section>
  );
};

export default PageLoading;
