import { Component } from "react";

import PageErrorState from "@/shared/ui/PageErrorState";

import type { ReactNode } from "react";

type PageErrorBoundaryProps = {
  children: ReactNode;
  getErrorMessage?: (error: Error) => string;
  onRetry: () => Promise<unknown>;
  resetKey?: string;
};

type PageErrorBoundaryState = {
  error: Error | undefined;
  isRetrying: boolean;
};

class PageErrorBoundary extends Component<
  PageErrorBoundaryProps,
  PageErrorBoundaryState
> {
  state: PageErrorBoundaryState = {
    error: undefined,
    isRetrying: false,
  };

  static getDerivedStateFromError(error: Error): PageErrorBoundaryState {
    return { error, isRetrying: false };
  }

  componentDidUpdate(previousProps: PageErrorBoundaryProps) {
    if (this.state.error && previousProps.resetKey !== this.props.resetKey) {
      this.setState({ error: undefined });
    }
  }

  handleRetry = async () => {
    const { onRetry } = this.props;

    this.setState({ isRetrying: true });
    try {
      await onRetry();
      this.setState({ error: undefined, isRetrying: false });
    } catch {
      this.setState({ isRetrying: false });
    }
  };

  render() {
    const { children, getErrorMessage } = this.props;
    const { error, isRetrying } = this.state;

    if (error) {
      const message =
        getErrorMessage?.(error) ?? "データを取得できませんでした";

      return (
        <PageErrorState
          title={message}
          actions={[
            {
              id: "retry",
              label: isRetrying ? "再試行中..." : "再試行",
              onClick: this.handleRetry,
              isDisabled: isRetrying,
              type: "button",
            },
            {
              id: "home",
              label: "トップへ戻る",
              to: "/",
              type: "link",
            },
          ]}
        />
      );
    }

    return children;
  }
}

export default PageErrorBoundary;
