"use client";

import * as AccordionPrimitive from "@radix-ui/react-accordion";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export const Accordion = AccordionPrimitive.Root;
export const AccordionItem = AccordionPrimitive.Item;

export const AccordionTrigger = ({ className, children, ...props }: AccordionPrimitive.AccordionTriggerProps & { children: React.ReactNode }) => (
  <AccordionPrimitive.Header className="flex">
    <AccordionPrimitive.Trigger
      className={cn(
        "flex flex-1 items-center justify-between rounded-2xl border border-transparent bg-muted/50 px-4 py-3 text-left text-sm font-semibold transition hover:border-brand-500 data-[state=open]:bg-background",
        className,
      )}
      {...props}
    >
      <span>{children}</span>
      <ChevronDown className="h-4 w-4 transition-transform data-[state=open]:rotate-180" />
    </AccordionPrimitive.Trigger>
  </AccordionPrimitive.Header>
);

export const AccordionContent = ({ className, children, ...props }: AccordionPrimitive.AccordionContentProps & { children: React.ReactNode }) => (
  <AccordionPrimitive.Content
    className={cn(
      "overflow-hidden text-sm text-muted-foreground data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down",
      className,
    )}
    {...props}
  >
    <div className="px-4 pb-4 pt-2">{children}</div>
  </AccordionPrimitive.Content>
);
