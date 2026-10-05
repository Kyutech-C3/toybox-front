import { useLayoutEffect } from "react";

type PageMetadataProps = {
  title: string;
  description?: string;
  canonicalUrl?: string;
  isNoIndex?: boolean;
};

const DEFAULT_DESCRIPTION =
  "ToyBoxは九州工業大学情報工学部の Composite Computer Club（C3）の作品ポータルサイトです。C3部員が製作した作品の閲覧が出来ます。";
const DESCRIPTION_MAX_LENGTH = 160;

const PageMetadata = ({
  title,
  description,
  canonicalUrl,
  isNoIndex = false,
}: PageMetadataProps) => {
  const pageTitle = title.trim();
  const documentTitle = pageTitle ? `${pageTitle} | ToyBox` : "ToyBox";
  const pageDescription =
    description?.replace(/\s+/g, " ").trim() || DEFAULT_DESCRIPTION;

  useLayoutEffect(() => {
    // 初期HTMLのtitle要素を維持し、画面切り替えでも空にしない。
    document.title = documentTitle;
  }, [documentTitle]);

  return (
    <>
      <meta
        name="description"
        content={Array.from(pageDescription)
          .slice(0, DESCRIPTION_MAX_LENGTH)
          .join("")}
      />
      {canonicalUrl && !isNoIndex && (
        <link rel="canonical" href={canonicalUrl} />
      )}
      {isNoIndex && <meta name="robots" content="noindex" />}
    </>
  );
};

export default PageMetadata;
