import { Component } from "react";

import PageErrorState from "@/shared/ui/PageErrorState";
import { ApiError } from "@/util/fetchData";

import type { ReactNode } from "react";
import type {
  PageErrorAction,
  PageErrorStateLayout,
} from "@/shared/ui/PageErrorState";

type PageErrorBoundaryProps = {
  children: ReactNode;
  getErrorMessage?: (error: Error) => string;
  isHomeActionVisible?: boolean;
  layout?: PageErrorStateLayout;
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
    const {
      children,
      getErrorMessage,
      isHomeActionVisible = true,
      layout,
    } = this.props;
    const { error, isRetrying } = this.state;

    if (error) {
      const message =
        getErrorMessage?.(error) ??
        (error instanceof ApiError
          ? error.displayMessage
          : "画面の表示中に問題が発生しました");

      const actions: PageErrorAction[] = [
        {
          id: "retry",
          label: isRetrying ? "再試行中..." : "再試行",
          onClick: this.handleRetry,
          isDisabled: isRetrying,
          type: "button",
        },
      ];

      if (isHomeActionVisible) {
        actions.push({
          id: "home",
          label: "トップへ戻る",
          to: "/",
          type: "link",
        });
      }

      return (
        <PageErrorState title={message} actions={actions} layout={layout} />
      );
    }

    return children;
  }
}

export default PageErrorBoundary;
