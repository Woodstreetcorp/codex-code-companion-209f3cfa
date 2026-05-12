import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, RefreshCw } from "lucide-react";
import { BrandedErrorPage } from "@/components/error/branded-error-page";

export const Route = createFileRoute("/500")({
  head: () => ({
    meta: [
      { title: "Something went wrong — approvU" },
      { name: "description", content: "An unexpected error occurred. Please try again or contact support." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ServerErrorPage,
});

function ServerErrorPage() {
  return (
    <BrandedErrorPage
      code="500"
      eyebrow="Server error"
      title="Something didn't load on our end"
      description="We hit an unexpected error. Our team has been notified — please try again, or head back home."
      primaryAction={
        <button
          onClick={() => window.location.reload()}
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
