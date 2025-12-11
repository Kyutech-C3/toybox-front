import MarkdownPreview from "../MarkdownPreview";
import useWorkDetail from "./hooks/useWorkDetail";

import Paper from "@/shared/ui/Paper";

type WorkDetailProps = {
  workID: string;
};

const WorkDetail = ({ workID }: WorkDetailProps) => {
  const { data, error } = useWorkDetail(workID);

  if (error) {
    return <div>エラー: {error.message}</div>;
  }

  if (!data) {
    return <div>データがありません</div>;
  }
  console.log(data.assets);
  return (
    <Paper>
      <h1>{data.title}</h1>
      <MarkdownPreview content={data.description} />
    </Paper>
  );
};

export default WorkDetail;
