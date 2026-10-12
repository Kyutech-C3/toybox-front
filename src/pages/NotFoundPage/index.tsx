import PageErrorState from "@/shared/ui/PageErrorState";

const NotFoundPage = () => {
  return (
    <div>
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
    </div>
  );
};

export default NotFoundPage;
