import { Suspense } from "react";
import { flushSync } from "react-dom";
import { MemoryRouter } from "react-router-dom";
import { createRoot } from "react-dom/client";
import { SWRConfig } from "swr";
import { afterEach } from "vitest";

import ToastProvider from "@/shared/ui/Toast/ToastProvider";

import type { ReactNode } from "react";

const CLEANUPS: (() => Promise<void>)[] = [];

afterEach(async () => {
  for (const cleanup of CLEANUPS.splice(0).reverse()) await cleanup();
});

export const render = async (children: ReactNode) => {
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);
  const rerender = async (next: ReactNode) => {
    flushSync(() => root.render(next));
  };
  const unmount = async () => {
    flushSync(() => root.unmount());
    container.remove();
  };
  CLEANUPS.push(unmount);
  await rerender(children);
  return { container, rerender };
};

type TestProvidersProps = { children: ReactNode; initialEntries?: string[] };
export const TestProviders = ({
  children,
  initialEntries,
}: TestProvidersProps) => (
  <MemoryRouter initialEntries={initialEntries}>
    <SWRConfig
      value={{
        suspense: true,
        dedupingInterval: 2000,
        shouldRetryOnError: false,
        revalidateOnFocus: false,
        revalidateOnReconnect: false,
      }}
    >
      <ToastProvider>
        <Suspense fallback={<p>読み込み中</p>}>{children}</Suspense>
      </ToastProvider>
    </SWRConfig>
  </MemoryRouter>
);
