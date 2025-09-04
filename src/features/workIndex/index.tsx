import Card from "../ui/Card";
import useWorks from "./hook/useWorks";

const WorkIndex = () => {
  const { data, error, isLoading, refetch } = useWorks();

  return (
    <div>
      <h1>Works</h1>
      <Card
        title={"test"}
        tags={["aa", "bb"]}
        postDate={new Date(2025, 2, 2)}
      />
    </div>
  );
};

export default WorkIndex;
