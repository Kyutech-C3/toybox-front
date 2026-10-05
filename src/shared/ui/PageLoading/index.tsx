import styles from "./index.module.css";

import LoadingSpinner from "@/shared/ui/LoadingSpinner";
import PageMetadata from "@/shared/ui/PageMetadata";

type PageLoadingProps = {
  layout?: "page" | "section";
  title?: string;
};

const PageLoading = ({
  layout = "page",
  title = "読み込み中",
}: PageLoadingProps) => {
  return (
    <section className={styles["page-loading"]} data-layout={layout}>
      {layout === "page" && (
        <PageMetadata title={title} description="ページを読み込んでいます。" />
      )}
      <LoadingSpinner />
    </section>
  );
};

export default PageLoading;
