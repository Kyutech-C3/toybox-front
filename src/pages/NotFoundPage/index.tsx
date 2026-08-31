import Header from "@/features/Header";
import PageErrorState from "@/shared/ui/PageErrorState";

const NotFoundPage = () => {
  return (
    <>
      <Header />
      <main>
        <PageErrorState
          title="ページが見つかりません"
          description="URLが正しいか確認するか、トップページへ戻ってください。"
          actions={[
            {
              id: "home",
              label: "トップへ戻る",
              to: "/",
              type: "link",
            },
          ]}
        />
      </main>
    </>
  );
};

export default NotFoundPage;
