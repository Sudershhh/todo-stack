import {
  HeadContent,
  Scripts,
  createRootRoute,
  useRouterState,
} from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";
import { TanStackDevtools } from "@tanstack/react-devtools";

import { useNetworkStatus } from "../hooks/useNetworkStatus";

import appCss from "../styles.css?url";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      {
        charSet: "utf-8",
      },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1",
      },
      {
        title: "Todo App",
      },
    ],
    links: [
      {
        rel: "preconnect",
        href: "https://fonts.googleapis.com",
      },
      {
        rel: "preconnect",
        href: "https://fonts.gstatic.com",
        crossOrigin: "anonymous",
      },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Nunito:wght@400;500;600;700&display=swap",
      },
      {
        rel: "icon",
        href: "/todo.png",
        type: "image/png",
      },
      {
        rel: "stylesheet",
        href: appCss,
      },
    ],
  }),
  shellComponent: RootDocument,
  errorComponent: RootErrorBoundary,
});

function RootDocument({ children }: { children: React.ReactNode }) {
  useNetworkStatus();

  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <TanStackDevtools
          config={{
            position: "bottom-right",
          }}
          plugins={[
            {
              name: "Tanstack Router",
              render: <TanStackRouterDevtoolsPanel />,
            },
          ]}
        />
        <Scripts />
      </body>
    </html>
  );
}

function RootErrorBoundary() {
  const error = useRouterState({
    select: (state) => (state as unknown as { error?: unknown }).error,
  });

  let message = "Something went wrong.";

  if (error && typeof error === "object" && "message" in error) {
    const maybeError = error as { message?: string };
    if (maybeError.message) {
      message = maybeError.message;
    }
  }

  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        <main style={{ padding: "2rem", fontFamily: '"Nunito", sans-serif' }}>
          <h1 style={{ fontSize: "1.5rem", marginBottom: "0.75rem" }}>
            Oops, something went wrong
          </h1>
          <p style={{ marginBottom: "0.5rem" }}>{message}</p>
          <p style={{ fontSize: "0.875rem", color: "#666" }}>
            Try refreshing the page. If the problem persists, please try again
            later.
          </p>
        </main>
        <Scripts />
      </body>
    </html>
  );
}
