import { Component } from "react";

import styles from "./index.module.css";

import type { ReactNode } from "react";

type PageErrorBoundaryProps = {
  children: ReactNode;
  getErrorMessage?: (error: Error) => string;
  resetKey?: string;
};

type PageErrorBoundaryState = {
  error: Error | undefined;
};

class PageErrorBoundary extends Component<
  PageErrorBoundaryProps,
  PageErrorBoundaryState
> {
  state: PageErrorBoundaryState = {
    error: undefined,
  };

  static getDerivedStateFromError(error: Error): PageErrorBoundaryState {
    return { error };
  }

  componentDidUpdate(previousProps: PageErrorBoundaryProps) {
    if (this.state.error && previousProps.resetKey !== this.props.resetKey) {
      this.setState({ error: undefined });
    }
  }

  render() {
    const { children, getErrorMessage } = this.props;
    const { error } = this.state;

    if (error) {
      const message =
        getErrorMessage?.(error) ?? "データを取得できませんでした";

      return (
        <section className={styles["page-error"]} role="alert">
          <h1>{message}</h1>
        </section>
      );
    }

    return children;
  }
}

export default PageErrorBoundary;
