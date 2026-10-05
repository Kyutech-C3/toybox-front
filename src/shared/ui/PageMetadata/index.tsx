type PageMetadataProps = {
  title: string;
  description?: string;
};

const DEFAULT_DESCRIPTION =
  "ToyBoxは九州工業大学情報工学部の Composite Computer Club（C3）の作品ポータルサイトです。C3部員が製作した作品の閲覧が出来ます。";
const DESCRIPTION_MAX_LENGTH = 160;

const PageMetadata = ({ title, description }: PageMetadataProps) => {
  const pageTitle = title.trim();
  const pageDescription =
    description?.replace(/\s+/g, " ").trim() || DEFAULT_DESCRIPTION;

  return (
    <>
      <title>{pageTitle ? `${pageTitle} | ToyBox` : "ToyBox"}</title>
      <meta
        name="description"
        content={Array.from(pageDescription)
          .slice(0, DESCRIPTION_MAX_LENGTH)
          .join("")}
      />
    </>
  );
};

export default PageMetadata;
