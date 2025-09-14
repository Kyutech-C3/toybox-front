import useWorks from "./hook/useWorks";
import styles from "./index.module.css";

import Card from "@/shared/ui/Card";

const WorkIndex = () => {
	const { data, error, isLoading } = useWorks();

	if (isLoading) {
		return (
			<div>
				<p>読み込み中...</p>
			</div>
		);
	}

	if (error) {
		return <div>エラー: {error.message}</div>;
	}

	if (!data) {
		return <div>データがありません</div>;
	}

	return (
		<div className={styles["works-index"]}>
			{data.map((work) => (
				<Card
					key={work.id}
					title={
						work.title.length > 14
							? `${work.title.slice(0, 14)}...`
							: work.title
					}
					tags={["test", "mock"]}
					imageURL={
						work.assets[0].asset_type === "image"
							? work.assets[0].url
							: undefined
					}
					postDate={new Date(work.created_at.split(" ")[0])}
				/>
			))}
		</div>
	);
};

export default WorkIndex;
