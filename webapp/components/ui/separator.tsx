import * as React from "react";
import { Separator as RadixSeparator } from "@radix-ui/react-separator";
import { cn } from "@/lib/utils";

export interface SeparatorProps extends React.ComponentPropsWithoutRef<typeof RadixSeparator> {}

export function Separator({ className, orientation = "horizontal", decorative = true, ...props }: SeparatorProps) {
  return (
    <RadixSeparator
      decorative={decorative}
      orientation={orientation}
      className={cn(
        "bg-border",
        orientation === "horizontal" ? "h-px w-full" : "h-full w-px",
        className,
      )}
      {...props}
    />
  );
}
