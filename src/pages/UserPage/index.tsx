import styles from "./index.module.css";

import Header from "@/features/Header";

const UserPage = () => {
  return (
    <>
      <Header />
      <main className={styles["main-wrapper"]}>
        <h1>UserPage</h1>
      </main>
    </>
  );
};

export default UserPage;
