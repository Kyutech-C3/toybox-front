import type { TagDetail } from "@/shared/types/work";

type GetWorkIndexSelectionParams = {
  searchParams: URLSearchParams;
  allTags: TagDetail[];
};

export const getWorkIndexSelection = ({
  searchParams,
  allTags,
}: GetWorkIndexSelectionParams) => {
  const searchableTags = allTags.filter((tag) => tag.work_count > 0);
  const tagsByID = new Map(searchableTags.map((tag) => [tag.id, tag]));
  const requestedTagIDs = searchParams.get("tags")?.split(",") ?? [];
  const selectedTagIDs = [...new Set(requestedTagIDs)].filter((tagID) =>
    tagsByID.has(tagID),
  );
  const selectedTags = selectedTagIDs.flatMap((tagID) => {
    const tag = tagsByID.get(tagID);
    return tag ? [tag] : [];
  });
  const requestedPage = Number(searchParams.get("page"));
  const currentPage =
    Number.isSafeInteger(requestedPage) && requestedPage > 0
      ? requestedPage
      : 1;

  return { searchableTags, selectedTagIDs, selectedTags, currentPage };
};
