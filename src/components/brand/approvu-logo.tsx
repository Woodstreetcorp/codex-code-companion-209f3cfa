import { ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

export function AppLogo({
  className,
  imageClassName,
}: {
  className?: string;
  imageClassName?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2 font-semibold text-foreground", className)}>
      <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
        <ShieldCheck className="h-4 w-4" />
      </span>
      <span className={cn("text-lg leading-none", imageClassName)}>approvU</span>
    </span>
  );
}