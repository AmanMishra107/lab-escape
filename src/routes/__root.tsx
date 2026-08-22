import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error("Root Error Boundary caught:", error);
  const router = useRouter();
  useEffect(() => {
    try {
      reportLovableError(error, { boundary: "tanstack_root_error_component" });
    } catch {
      /* ignore */
    }
  }, [error]);

  const handleClearSaveAndReload = () => {
    try {
      localStorage.clear();
      window.location.reload();
    } catch {
      window.location.href = "/";
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-stone-900 px-4 text-lab-paper font-mono">
      <div className="max-w-xl text-center border-3 border-lab-ink bg-stone-800 p-6 shadow-2xl rounded-none brut">
        <div className="inline-block bg-lab-red text-white text-xs font-black px-2 py-1 mb-3">
          SYSTEM FAULT DETECTED
        </div>
        <h1 className="text-2xl font-black text-amber-400 font-display">
          THIS PAGE DIDN'T LOAD
        </h1>
        <p className="mt-2 text-xs text-stone-300">
          Something interrupted the system startup or route execution.
        </p>

        {error && (
          <div className="mt-4 max-h-40 overflow-auto border-2 border-red-500/50 bg-black/80 p-3 text-left font-mono text-[11px] text-red-400">
            <p className="font-bold">{error.name}: {error.message}</p>
            {error.stack && <pre className="mt-2 opacity-80 text-[9px] whitespace-pre-wrap">{error.stack}</pre>}
          </div>
        )}

        <div className="mt-6 flex flex-wrap justify-center gap-3 text-xs font-bold">
          <button
            onClick={() => {
              try {
                router.invalidate();
              } catch {
                /* ignore */
              }
              reset();
            }}
            className="brut-sm bg-emerald-600 px-4 py-2 text-white hover:bg-emerald-500"
          >
            🔄 TRY AGAIN
          </button>
          <button
            onClick={handleClearSaveAndReload}
            className="brut-sm bg-amber-500 px-4 py-2 text-stone-950 hover:bg-amber-400"
          >
            🧹 RESET LOCAL CACHE & RELOAD
          </button>
          <a
            href="/"
            className="brut-sm bg-stone-700 px-4 py-2 text-white hover:bg-stone-600"
          >
            🏠 GO HOME
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, maximum-scale=1" },
      { name: "author", content: "Lab 404" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      ...(typeof appCss === "string" && appCss ? [{ rel: "stylesheet", href: appCss }] : []),
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Anton&family=Space+Grotesk:wght@400;500;700&family=JetBrains+Mono:wght@400;700&display=swap",
      },
      { rel: "icon", href: "/favicon.svg", type: "image/svg+xml" },
      { rel: "alternate icon", href: "/favicon.ico", type: "image/x-icon" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  // In client SPA mode (browser environment with #root element), avoid nesting <html> inside #root
  if (typeof window !== "undefined") {
    return <>{children}</>;
  }

  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const context = Route.useRouteContext();
  const [queryClient] = useState(() => context?.queryClient || new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
      <Outlet />
    </QueryClientProvider>
  );
}
