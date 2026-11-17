import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500",
  {
    variants: {
      variant: {
        default:
          "border-zinc-700 bg-zinc-800 text-zinc-100",
        secondary:
          "border-zinc-800 bg-zinc-900 text-zinc-400",
        destructive:
          "border-rose-800/60 bg-rose-950/60 text-rose-400",
        outline:
          "text-zinc-200 border-zinc-700",
        easy:
          "border-emerald-800/60 bg-emerald-950/60 text-emerald-400",
        medium:
          "border-amber-800/60 bg-amber-950/60 text-amber-400",
        hard:
          "border-rose-800/60 bg-rose-950/60 text-rose-400",
        success:
          "border-emerald-700 bg-emerald-950/80 text-emerald-300",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
