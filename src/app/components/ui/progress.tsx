import * as React from "react";
import { cn } from "./utils";

interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number;
  className?: string;
}

function Progress({ className, value = 0, ...props }: ProgressProps) {
  const safeValue = Math.min(Math.max(value || 0, 0), 100);
  
  return (
    <div
      className={cn(
        "relative h-2 w-full overflow-hidden rounded-full bg-gray-200/20",
        className,
      )}
      {...props}
    >
      <div
        className="h-full w-full flex-1 bg-purple-500 transition-all duration-300 ease-in-out rounded-full"
        style={{ width: `${safeValue}%` }}
      />
    </div>
  );
}

export { Progress };
