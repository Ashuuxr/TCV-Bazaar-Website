import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { Toaster } from "@/components/ui/sonner";

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
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
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
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "TCV Bazaar 2026 — Diwali Edition, Gwalior" },
      { name: "description", content: "TCV Bazaar is Gwalior's premium exhibition & event platform. Book stalls for the Diwali Edition, 23–25 October 2026 at Keshar Towers, Gwalior." },
      { name: "author", content: "The City Vibes Marketing" },
      { name: "application-name", content: "TCV Bazaar" },
      { name: "theme-color", content: "#0f172a" },
      { name: "format-detection", content: "telephone=no" },
      { property: "og:title", content: "TCV Bazaar 2026 — Diwali Edition, Gwalior" },
      { property: "og:description", content: "TCV Bazaar is Gwalior's premium exhibition & event platform. Book stalls for the Diwali Edition, 23–25 October 2026 at Keshar Towers, Gwalior." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://tcvbazaar.com/" },
      { property: "og:site_name", content: "TCV Bazaar" },
      { property: "og:locale", content: "en_IN" },
      { property: "og:image", content: "https://tcvbazaar.com/tcv-bazaar-official-logo.png" },
      { property: "og:image:alt", content: "TCV Bazaar official logo" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:site", content: "@TCVBazaar" },
      { name: "twitter:title", content: "TCV Bazaar 2026 — Diwali Edition, Gwalior" },
      { name: "twitter:description", content: "TCV Bazaar is Gwalior's premium exhibition & event platform. Book stalls for the Diwali Edition, 23–25 October 2026 at Keshar Towers, Gwalior." },
      { name: "twitter:image", content: "https://tcvbazaar.com/tcv-bazaar-official-logo.png" },
      { name: "twitter:image:alt", content: "TCV Bazaar official logo" },
      { name: "robots", content: "index, follow, max-image-preview:large" },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,300;9..144,400;9..144,500;9..144,600;9..144,700&family=Inter:wght@300;400;500;600;700&display=swap",
      },
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "icon", href: "/tcv-bazaar-favicon-google-2026.ico", type: "image/x-icon" },
      { rel: "shortcut icon", href: "/tcv-bazaar-favicon-google-2026.ico", type: "image/x-icon" },
      { rel: "apple-touch-icon", href: "/tcv-bazaar-favicon-google-2026.ico" },
      { rel: "manifest", href: "/site.webmanifest" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
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
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
      <Outlet />
      <Toaster />
    </QueryClientProvider>
  );
}
