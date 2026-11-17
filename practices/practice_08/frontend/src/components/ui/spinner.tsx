import * as React from "react";
import { cn } from "../../lib/utils";

export interface SpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: "sm" | "default" | "lg";
}

export const Spinner: React.FC<SpinnerProps> = ({
  className,
  size = "default",
  ...props
}) => {
  const sizeClasses = {
    sm: "h-3.5 w-3.5 border-2",
    default: "h-5 w-5 border-2",
    lg: "h-8 w-8 border-3",
  };

  return (
    <div
      role="status"
      aria-label="Loading"
      className={cn(
        "inline-block rounded-full border-zinc-700 border-t-emerald-500 animate-spin",
        sizeClasses[size],
        className
      )}
      {...props}
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
};
