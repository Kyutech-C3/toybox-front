import styles from "./index.module.css";

type AvaterProps = {
	avatarURL?: string;
};

const Avater = ({ avatarURL = "./comingSoonLugia.webp" }: AvaterProps) => {
	return (
		<div className={styles["avatar-wrapper"]}>
			<img
				alt="avatar-image"
				src={avatarURL}
				className={styles["avatar-image"]}
			/>
		</div>
	);
};

export default Avater;
