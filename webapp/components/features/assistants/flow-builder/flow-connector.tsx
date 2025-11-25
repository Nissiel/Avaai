"use client";

import { motion } from "framer-motion";
import type { FlowConnection, FlowNode } from "./types";

interface FlowConnectorProps {
  connection: FlowConnection;
  nodes: FlowNode[];
}

/**
 * Draws an SVG curved arrow between two nodes
 */
export function FlowConnector({ connection, nodes }: FlowConnectorProps) {
  const fromNode = nodes.find((n) => n.id === connection.from);
  const toNode = nodes.find((n) => n.id === connection.to);

  if (!fromNode || !toNode) {
    return null;
  }

  // Calculate connection points
  // Nodes are 320px wide (w-80) but responsive with max-w-[90vw]
  // Use a reasonable fixed width for calculations
  const nodeWidth = 320;
  const nodeHeight = 200; // approximate height including padding

  // Start point: bottom center of fromNode
  const startX = fromNode.position.x + nodeWidth / 2;
  const startY = fromNode.position.y + nodeHeight;

  // End point: top center of toNode
  const endX = toNode.position.x + nodeWidth / 2;
  const endY = toNode.position.y;

  // Calculate control points for smooth Bezier curve
  const controlPointOffset = Math.abs(endY - startY) / 3;
  const cp1X = startX;
  const cp1Y = startY + controlPointOffset;
  const cp2X = endX;
  const cp2Y = endY - controlPointOffset;

  // Create path for the arrow line
  const pathData = `M ${startX} ${startY} C ${cp1X} ${cp1Y}, ${cp2X} ${cp2Y}, ${endX} ${endY}`;

  // Arrow head dimensions
  const arrowSize = 8;

  return (
    <motion.g
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, delay: 0.3 }}
    >
      {/* Arrow line with gradient */}
      <defs>
        <linearGradient
          id={`gradient-${connection.from}-${connection.to}`}
          x1="0%"
          y1="0%"
          x2="0%"
          y2="100%"
        >
          <stop offset="0%" stopColor="rgb(147, 51, 234)" stopOpacity="0.4" />
          <stop offset="100%" stopColor="rgb(59, 130, 246)" stopOpacity="0.6" />
        </linearGradient>
      </defs>

      {/* Glow effect */}
      <motion.path
        d={pathData}
        fill="none"
        stroke={`url(#gradient-${connection.from}-${connection.to})`}
        strokeWidth="6"
        strokeLinecap="round"
        opacity="0.3"
        filter="blur(4px)"
      />

      {/* Main line */}
      <motion.path
        d={pathData}
        fill="none"
        stroke={`url(#gradient-${connection.from}-${connection.to})`}
        strokeWidth="3"
        strokeLinecap="round"
        strokeDasharray="1000"
        strokeDashoffset="1000"
        animate={{ strokeDashoffset: 0 }}
        transition={{ duration: 1, ease: "easeInOut" }}
      />

      {/* Arrow head */}
      <motion.polygon
        points={`
          ${endX},${endY}
          ${endX - arrowSize},${endY - arrowSize * 1.5}
          ${endX + arrowSize},${endY - arrowSize * 1.5}
        `}
        fill="rgb(59, 130, 246)"
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3, delay: 0.8 }}
      />

      {/* Animated flow dots */}
      <motion.circle
        r="4"
        fill="rgb(147, 51, 234)"
        opacity="0.8"
      >
        <animateMotion
          dur="3s"
          repeatCount="indefinite"
          path={pathData}
        />
      </motion.circle>
    </motion.g>
  );
}
