import styles from "./index.module.css";

import Header from "@/features/Header";

const AuthPage = () => {
  return (
    <>
      <Header />
      <main className={styles["main-wrapper"]}>
        <h1>AuthPage</h1>
      </main>
    </>
  );
};

export default AuthPage;
