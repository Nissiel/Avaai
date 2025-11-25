import type { LucideIcon } from "lucide-react";
import type { StudioConfigInput } from "@/lib/validations/config";

/**
 * Node types in the flow
 */
export type FlowNodeType = "trigger" | "action" | "endpoint";

/**
 * Configuration for each node
 * For MVP: stores references to the main assistant config
 */
export interface NodeConfig {
  // Prompt/Instructions
  systemPrompt?: string;
  firstMessage?: string;
  guidelines?: string;

  // Voice & Tone
  voiceProvider?: string;
  voiceId?: string;
  voiceSpeed?: number;
  tone?: string;

  // Advanced: Reference to full config
  // For MVP, nodes share the same config but can be overridden in future
  fullConfig?: Partial<StudioConfigInput>;
}

/**
 * Position of a node on the canvas
 */
export interface NodePosition {
  x: number;
  y: number;
}

/**
 * A single node in the flow
 */
export interface FlowNode {
  id: string;
  type: FlowNodeType;
  label: string;
  description: string;
  icon: LucideIcon;
  position: NodePosition;
  editable: boolean;
  config: NodeConfig;
  badge?: string; // Optional badge text (e.g., "AI Powered", "Email")
}

/**
 * Connection between two nodes
 */
export interface FlowConnection {
  from: string; // source node id
  to: string; // target node id
}

/**
 * Complete flow scenario
 */
export interface FlowScenario {
  id: string;
  name: string;
  description: string;
  nodes: FlowNode[];
  connections: FlowConnection[];
  isCustomizable: boolean; // false for MVP
}

/**
 * Selection state for node editor
 */
export interface NodeSelection {
  nodeId: string | null;
  isEditing: boolean;
}
