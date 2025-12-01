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
  return (
    <Paper>
      <h1>WorkDetail</h1>
      <p>{data.title}</p>
    </Paper>
  );
};

export default WorkDetail;
