"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useState } from "react";

type ReactQueryProviderProps = React.PropsWithChildren<{
  enableDevtools?: boolean;
}>;

export function ReactQueryProvider({ children, enableDevtools = process.env.NODE_ENV !== "production" }: ReactQueryProviderProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: false,
            refetchOnReconnect: true,
            retry: 1,
            staleTime: 15 * 1000,
          },
          mutations: {
            retry: 1,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {enableDevtools ? <ReactQueryDevtools position="bottom-right" buttonPosition="bottom-left" /> : null}
    </QueryClientProvider>
  );
}
