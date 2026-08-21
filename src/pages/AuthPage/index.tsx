import styles from "./index.module.css";

import AuthCallback from "@/features/auth/AuthCallback";
import Header from "@/features/Header";

const AuthPage = () => {
  return (
    <>
      <Header />
      <main className={styles["main-wrapper"]}>
        <AuthCallback />
      </main>
    </>
  );
};

export default AuthPage;
