"use client";

import { useState, useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { GlassCard } from "@/components/ui/glass-card";
import { Workflow, Lock } from "lucide-react";
import { FlowNode } from "./flow-node";
import { FlowConnector } from "./flow-connector";
import { NodeEditorSidebar } from "./node-editor-sidebar";
import type { FlowScenario, NodeConfig, FlowNode as FlowNodeType } from "./types";

interface FlowCanvasProps {
  scenario: FlowScenario;
  onNodeConfigUpdate: (nodeId: string, config: NodeConfig) => void;
}

export function FlowCanvas({ scenario, onNodeConfigUpdate }: FlowCanvasProps) {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [nodes, setNodes] = useState<FlowNodeType[]>(scenario.nodes);

  const selectedNode = nodes.find((n) => n.id === selectedNodeId) || null;

  const handleNodeSelect = useCallback((nodeId: string) => {
    setSelectedNodeId(nodeId);
  }, []);

  const handleNodeConfigSave = useCallback(
    (nodeId: string, config: NodeConfig) => {
      // Update local state
      setNodes((prevNodes) =>
        prevNodes.map((node) =>
          node.id === nodeId ? { ...node, config } : node
        )
      );

      // Notify parent component
      onNodeConfigUpdate(nodeId, config);
    },
    [onNodeConfigUpdate]
  );

  const handleCloseSidebar = useCallback(() => {
    setSelectedNodeId(null);
  }, []);

  return (
    <div className="flex flex-col gap-6">
      {/* Header Card */}
      <GlassCard className="border" variant="none">
        <div className="p-6">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-500/10">
                  <Workflow className="h-5 w-5 text-brand-600 dark:text-brand-400" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-foreground">
                    {scenario.name}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {scenario.description}
                  </p>
                </div>
              </div>
            </div>
            {!scenario.isCustomizable && (
              <Badge variant="outline" className="gap-2">
                <Lock className="h-3 w-3" />
                Standard Flow (MVP)
              </Badge>
            )}
          </div>

          {!scenario.isCustomizable && (
            <div className="mt-4 rounded-lg bg-muted/50 p-3 text-sm text-muted-foreground border border-border">
              <strong className="text-foreground">Note:</strong> Custom flows
              coming soon! For now, this standard scenario is optimized for
              handling missed calls with AI.
            </div>
          )}
        </div>
      </GlassCard>

      {/* Flow Canvas */}
      <GlassCard className="border relative overflow-hidden" variant="none">
        <div className="relative min-h-[800px] md:min-h-[900px] p-4 md:p-8 bg-gradient-to-b from-background via-muted/20 to-background overflow-x-auto">
          {/* Grid background pattern */}
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: `
                linear-gradient(to right, currentColor 1px, transparent 1px),
                linear-gradient(to bottom, currentColor 1px, transparent 1px)
              `,
              backgroundSize: "40px 40px",
            }}
          />

          {/* SVG layer for connectors */}
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none"
            style={{ zIndex: 1 }}
          >
            {scenario.connections.map((connection, idx) => (
              <FlowConnector
                key={`${connection.from}-${connection.to}-${idx}`}
                connection={connection}
                nodes={nodes}
              />
            ))}
          </svg>

          {/* Nodes layer */}
          <div className="relative" style={{ zIndex: 2 }}>
            {nodes.map((node) => (
              <FlowNode
                key={node.id}
                node={node}
                isSelected={selectedNodeId === node.id}
                onSelect={handleNodeSelect}
              />
            ))}
          </div>

          {/* Helper text at bottom */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-center">
            <p className="text-xs text-muted-foreground">
              Click on a node to edit its configuration
            </p>
          </div>
        </div>
      </GlassCard>

      {/* Node Editor Sidebar */}
      <NodeEditorSidebar
        node={selectedNode}
        isOpen={selectedNodeId !== null}
        onClose={handleCloseSidebar}
        onSave={handleNodeConfigSave}
      />
    </div>
  );
}
