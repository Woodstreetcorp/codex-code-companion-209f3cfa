import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";

import appCss from "../styles.css?url";
import { Toaster } from "@/components/ui/sonner";
import { BrandedErrorPage } from "@/components/error/branded-error-page";
import { ArrowRight, RefreshCw, Search } from "lucide-react";

function NotFoundComponent() {
  return (
    <BrandedErrorPage
      code="404"
      eyebrow="Page not found"
      title="We couldn't find that page"
      description="The link may be broken, the page may have been moved, or you may have mistyped the URL. Try one of the destinations on the right."
      primaryAction={
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
        >
          Go home <ArrowRight className="h-4 w-4" />
        </Link>
      }
      secondaryAction={
        <Link
          to="/portal"
          className="inline-flex items-center gap-1.5 rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-accent"
        >
          <Search className="h-4 w-4" /> Open the portal
        </Link>
      }
    />
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();

  return (
    <BrandedErrorPage
      code="500"
      eyebrow="Something went wrong"
      title="This page didn't load"
      description={
        error?.message
          ? `We hit an unexpected error: ${error.message}. Try again, or head back home.`
          : "We hit an unexpected error. Try again, or head back home."
      }
      primaryAction={
        <button
          onClick={() => { router.invalidate(); reset(); }}
          className="inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
        >
          <RefreshCw className="h-4 w-4" /> Try again
        </button>
      }
      secondaryAction={
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-accent"
        >
          Go home <ArrowRight className="h-4 w-4" />
        </Link>
      }
    />
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "approvU — Mortgage Snapshot" },
      { name: "description", content: "A guided, conversational mortgage qualification experience by approvU." },
      { name: "author", content: "approvU" },
      { property: "og:title", content: "approvU — Mortgage Snapshot" },
      { property: "og:description", content: "A guided, conversational mortgage qualification experience by approvU." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:site", content: "@approvU" },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap",
      },
      {
        rel: "stylesheet",
        href: appCss,
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body suppressHydrationWarning>
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
      <Outlet />
      <Toaster />
    </QueryClientProvider>
  );
}
