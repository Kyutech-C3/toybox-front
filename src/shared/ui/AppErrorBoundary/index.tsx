import { Component } from "react";

import PageErrorState from "@/shared/ui/PageErrorState";

import type { ReactNode } from "react";

type AppErrorBoundaryProps = {
  children: ReactNode;
};

type AppErrorBoundaryState = {
  hasError: boolean;
};

class AppErrorBoundary extends Component<
  AppErrorBoundaryProps,
  AppErrorBoundaryState
> {
  state: AppErrorBoundaryState = {
    hasError: false,
  };

  static getDerivedStateFromError(): AppErrorBoundaryState {
    return { hasError: true };
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    const { children } = this.props;
    const { hasError } = this.state;

    if (hasError) {
      return (
        <PageErrorState
          title="画面の表示中に問題が発生しました"
          description="ページを再読み込みしても直らない場合は、トップページからやり直してください。"
          actions={[
            {
              id: "reload",
              label: "再読み込み",
              onClick: this.handleReload,
              type: "button",
            },
            {
              href: "/",
              id: "home",
              label: "トップへ戻る",
              type: "anchor",
            },
          ]}
        />
      );
    }

    return children;
  }
}

export default AppErrorBoundary;
