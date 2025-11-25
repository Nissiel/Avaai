"use client";

import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { FlowNode as FlowNodeType } from "./types";

interface FlowNodeProps {
  node: FlowNodeType;
  isSelected: boolean;
  onSelect: (nodeId: string) => void;
}

const nodeTypeStyles = {
  trigger: {
    gradient: "from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900",
    border: "border-blue-300 dark:border-blue-700",
    iconBg: "bg-blue-500/10",
    iconColor: "text-blue-600 dark:text-blue-400",
    badgeVariant: "default" as const,
  },
  action: {
    gradient: "from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900",
    border: "border-purple-300 dark:border-purple-700",
    iconBg: "bg-purple-500/10",
    iconColor: "text-purple-600 dark:text-purple-400",
    badgeVariant: "brand" as const,
  },
  endpoint: {
    gradient: "from-green-50 to-green-100 dark:from-green-950 dark:to-green-900",
    border: "border-green-300 dark:border-green-700",
    iconBg: "bg-green-500/10",
    iconColor: "text-green-600 dark:text-green-400",
    badgeVariant: "outline" as const,
  },
};

export function FlowNode({ node, isSelected, onSelect }: FlowNodeProps) {
  const styles = nodeTypeStyles[node.type];
  const Icon = node.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      style={{
        position: "absolute",
        left: node.position.x,
        top: node.position.y,
      }}
      className="w-80 max-w-[90vw]"
    >
      <button
        onClick={() => node.editable && onSelect(node.id)}
        disabled={!node.editable}
        className={cn(
          "w-full text-left rounded-xl border-2 p-5 transition-all duration-200",
          "bg-gradient-to-br shadow-lg",
          styles.gradient,
          styles.border,
          isSelected
            ? "ring-4 ring-offset-2 ring-brand-500 scale-105 shadow-2xl"
            : "hover:scale-102 hover:shadow-xl",
          node.editable
            ? "cursor-pointer"
            : "cursor-not-allowed opacity-75"
        )}
      >
        {/* Header: Icon + Badge */}
        <div className="flex items-start justify-between mb-3">
          <div
            className={cn(
              "flex h-12 w-12 items-center justify-center rounded-lg",
              styles.iconBg
            )}
          >
            <Icon className={cn("h-6 w-6", styles.iconColor)} />
          </div>
          {node.badge && (
            <Badge variant={styles.badgeVariant} className="text-xs">
              {node.badge}
            </Badge>
          )}
        </div>

        {/* Content */}
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-foreground">
            {node.label}
          </h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {node.description}
          </p>
        </div>

        {/* Editable indicator */}
        {node.editable && (
          <div className="mt-4 pt-3 border-t border-border/50">
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <span className="inline-block w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              Click to edit configuration
            </p>
          </div>
        )}

        {!node.editable && (
          <div className="mt-4 pt-3 border-t border-border/50">
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <span className="inline-block w-2 h-2 rounded-full bg-gray-400" />
              System managed
            </p>
          </div>
        )}
      </button>

      {/* Connection points for arrows */}
      <div
        className="absolute left-1/2 -translate-x-1/2 top-0 w-3 h-3 rounded-full bg-border"
        data-connection-point="top"
      />
      <div
        className="absolute left-1/2 -translate-x-1/2 bottom-0 w-3 h-3 rounded-full bg-border"
        data-connection-point="bottom"
      />
    </motion.div>
  );
}
