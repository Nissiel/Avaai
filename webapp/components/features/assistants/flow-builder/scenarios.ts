import { Phone, Bot, Mail } from "lucide-react";
import type { FlowScenario } from "./types";

/**
 * MVP Standard Scenario: No answer → AI Agent → Email summary
 *
 * This is hardcoded for the MVP. Future versions will allow custom scenarios.
 */
export const STANDARD_SCENARIO: FlowScenario = {
  id: "standard-voicemail-flow",
  name: "Standard Call Flow",
  description: "Company number doesn't answer → AI Agent handles → Email summary sent",
  isCustomizable: false, // MVP: locked scenario
  nodes: [
    {
      id: "trigger-call",
      type: "trigger",
      label: "Call Received",
      description: "Incoming call - No answer",
      icon: Phone,
      position: { x: 50, y: 60 },
      editable: false,
      config: {},
      badge: "Trigger",
    },
    {
      id: "action-ai-agent",
      type: "action",
      label: "AI Agent Redirect",
      description: "Your assistant handles the call",
      icon: Bot,
      position: { x: 50, y: 280 },
      editable: true,
      config: {
        systemPrompt: "",
        firstMessage: "",
        guidelines: "",
        voiceProvider: "azure",
        voiceId: "fr-FR-DeniseNeural",
        voiceSpeed: 1.0,
        tone: "warm",
      },
      badge: "AI Powered",
    },
    {
      id: "endpoint-email",
      type: "endpoint",
      label: "Email Summary",
      description: "Send call summary to configured email",
      icon: Mail,
      position: { x: 50, y: 500 },
      editable: true,
      config: {},
      badge: "Email",
    },
  ],
  connections: [
    { from: "trigger-call", to: "action-ai-agent" },
    { from: "action-ai-agent", to: "endpoint-email" },
  ],
};

/**
 * Get the standard scenario with config populated from studio settings
 * This merges the scenario template with actual user configuration
 */
export function getStandardScenarioWithConfig(
  config: any // StudioConfigInput type
): FlowScenario {
  const scenario = { ...STANDARD_SCENARIO };

  // Populate AI Agent node with actual config
  const aiAgentNode = scenario.nodes.find((n) => n.id === "action-ai-agent");
  if (aiAgentNode) {
    aiAgentNode.config = {
      systemPrompt: config?.systemPrompt || "",
      firstMessage: config?.firstMessage || "",
      guidelines: config?.guidelines || "",
      voiceProvider: config?.voiceProvider || "azure",
      voiceId: config?.voiceId || "fr-FR-DeniseNeural",
      voiceSpeed: config?.voiceSpeed || 1.0,
      tone: config?.tone || "warm",
      fullConfig: config,
    };
  }

  return scenario;
}
