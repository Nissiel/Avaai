/**
 * ============================================================================
 * VAPI.AI CLIENT - Server-Side SDK
 * ============================================================================
 * Divine integration with Vapi.ai for managing assistants, calls, and more
 * @docs https://docs.vapi.ai/
 * ============================================================================
 */

import { VapiClient } from '@vapi-ai/server-sdk';

/**
 * ============================================================================
 * ENVIRONMENT VALIDATION - Divine & Strict
 * ============================================================================
 */

const VAPI_API_KEY = process.env.VAPI_API_KEY || 'temp_development_key';
const VAPI_PUBLIC_KEY_ENV = process.env.VAPI_PUBLIC_KEY || '';

// Validation non-blocking pour le développement
if (!process.env.VAPI_API_KEY && typeof window === 'undefined') {
  console.warn('\n⚠️  ══════════════════════════════════════════════════════');
  console.warn('⚠️  VAPI_API_KEY not configured in .env file');
  console.warn('⚠️  Get your API key at: https://dashboard.vapi.ai/api-keys');
  console.warn('⚠️  UI will load but API calls will fail');
  console.warn('⚠️  ══════════════════════════════════════════════════════\n');
}

/**
 * ============================================================================
 * VAPI CLIENT INSTANCE - Singleton Pattern
 * ============================================================================
 */

let vapiInstance: VapiClient | null = null;

function getVapiClient(): VapiClient {
  if (!VAPI_API_KEY) {
    throw new Error(
      'Cannot initialize Vapi client without API key. Please configure VAPI_API_KEY in your .env file.'
    );
  }

  if (!vapiInstance) {
    vapiInstance = new VapiClient({
      token: VAPI_API_KEY,
    });
  }

  return vapiInstance;
}

/**
 * Vapi Server Client (for API routes and server actions)
 * Lazy initialization - only creates client when actually needed
 */
export const vapi = VAPI_API_KEY ? getVapiClient() : ({} as VapiClient);

/**
 * Helper to check if Vapi is properly configured
 */
export const isVapiConfigured = (): boolean => {
  return !!VAPI_API_KEY;
};

/**
 * Vapi Public Key (for client-side SDK)
 * Use this in the frontend for real-time call handling
 */
export const VAPI_PUBLIC_KEY = VAPI_PUBLIC_KEY_ENV || '';

/**
 * ============================================================================
 * TYPE DEFINITIONS
 * ============================================================================
 */

export interface AvaAssistantConfig {
  name: string;
  voice: {
    provider: 'playht' | 'azure';
    voiceId: string;
  };
  model: {
    provider: 'openai';
    model: 'gpt-4' | 'gpt-3.5-turbo' | 'gpt-4o' | 'gpt-4o-mini';
    temperature?: number;
    maxTokens?: number;
  };
  firstMessage: string;
  systemPrompt: string;
  functions?: VapiFunction[];
  recordingEnabled?: boolean;
  endCallFunctionEnabled?: boolean;
  dialKeypadFunctionEnabled?: boolean;
}

export interface VapiFunction {
  name: string;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<string, any>;
    required?: string[];
  };
  url?: string; // Webhook URL
}

export interface VapiCall {
  id: string;
  assistantId: string;
  status: 'queued' | 'ringing' | 'in-progress' | 'forwarding' | 'ended';
  startedAt?: string;
  endedAt?: string;
  duration?: number;
  transcript?: string;
  recordingUrl?: string;
  cost?: number;
}

/**
 * ============================================================================
 * HELPER FUNCTIONS
 * ============================================================================
 */

/**
 * Create an AVA assistant with optimal defaults
 */
export async function createAvaAssistant(config: AvaAssistantConfig) {
  try {
    const modelConfig = config.model ?? {
      provider: "openai" as const,
      model: "gpt-4o-mini" as const,
      temperature: 0.7,
      maxTokens: 500,
    };

    const systemPrompt =
      config.systemPrompt ||
      "Tu es Ava, une assistante vocale polie et efficace. Concentre-toi sur l'aide à l'utilisateur et reste concise.";

    const assistant = await vapi.assistants.create({
      name: config.name,
      voice: {
        provider: config.voice.provider,
        voiceId: config.voice.voiceId,
      },
      model: {
        provider: modelConfig.provider,
        model: modelConfig.model,
        temperature: modelConfig.temperature ?? 0.7,
        maxTokens: modelConfig.maxTokens ?? 500,
        messages: [
          {
            role: 'system',
            content: systemPrompt,
          },
        ],
      },
      firstMessage:
        config.firstMessage ?? 'Bonjour, je suis Ava. Comment puis-je vous aider ?',
      ...(config.functions && config.functions.length > 0 && {
        functions: config.functions,
      }),
    });

    return {
      success: true,
      assistant,
    };
  } catch (error: any) {
    console.error('❌ Failed to create AVA assistant:', error);
    return {
      success: false,
      error: error.message || 'Unknown error',
    };
  }
}

/**
 * Update an existing AVA assistant
 */
export async function updateAvaAssistant(
  assistantId: string,
  config: Partial<AvaAssistantConfig>
) {
  try {
    const modelPayload =
      config.model || config.systemPrompt
        ? {
            provider: (config.model?.provider ?? 'openai') as 'openai',
            model: (config.model?.model ?? 'gpt-4o-mini') as 'gpt-4o-mini' | 'gpt-4o' | 'gpt-4' | 'gpt-3.5-turbo',
            ...(config.model?.temperature !== undefined && { temperature: config.model.temperature }),
            ...(config.model?.maxTokens !== undefined && { maxTokens: config.model.maxTokens }),
            ...(config.systemPrompt && {
              messages: [
                {
                  role: 'system' as const,
                  content: config.systemPrompt,
                },
              ],
            }),
          }
        : undefined;

    const updatePayload: any = {
      ...(config.name && { name: config.name }),
      ...(config.voice && {
        voice: {
          provider: config.voice.provider,
          voiceId: config.voice.voiceId,
        },
      }),
      ...(modelPayload && { model: modelPayload }),
      ...(config.firstMessage && { firstMessage: config.firstMessage }),
      ...(config.functions !== undefined && { functions: config.functions }),
    };

    const assistant = await vapi.assistants.update(assistantId, updatePayload);

    return {
      success: true,
      assistant,
    };
  } catch (error: any) {
    console.error('❌ Failed to update AVA assistant:', error);
    return {
      success: false,
      error: error.message || 'Unknown error',
    };
  }
}

/**
 * Make an outbound call with an AVA assistant
 */
export async function makeCall(assistantId: string, phoneNumber: string) {
  try {
    const call = await vapi.calls.create({
      assistantId,
      customer: {
        number: phoneNumber,
      },
    });

    return {
      success: true,
      call,
    };
  } catch (error: any) {
    console.error('❌ Failed to make call:', error);
    return {
      success: false,
      error: error.message || 'Unknown error',
    };
  }
}

/**
 * Get call details including transcript
 */
export async function getCall(callId: string): Promise<VapiCall | null> {
  try {
    const call = await vapi.calls.get(callId);
    return call as VapiCall;
  } catch (error: any) {
    console.error('❌ Failed to get call:', error);
    return null;
  }
}

/**
 * List all calls for monitoring
 */
export async function listCalls(limit = 20) {
  try {
    const calls = await vapi.calls.list({ limit });
    return {
      success: true,
      calls,
    };
  } catch (error: any) {
    console.error('❌ Failed to list calls:', error);
    return {
      success: false,
      error: error.message || 'Unknown error',
      calls: [],
    };
  }
}

/**
 * ============================================================================
 * VOICE PRESETS
 * ============================================================================
 */

export const VOICE_PRESETS = {
  // PlayHT Voices (Recommended - High Quality)
  playht: {
    jennifer: {
      provider: 'playht' as const,
      voiceId: 's3://voice-cloning-zero-shot/d9ff78ba-d016-47f6-b0ef-dd630f59414e/female-cs/manifest.json',
      name: 'Jennifer',
      description: 'Professionnelle, chaleureuse, voix féminine française',
      language: 'fr-FR',
    },
    ryan: {
      provider: 'playht' as const,
      voiceId: 's3://voice-cloning-zero-shot/e040bd1b-f190-4bdb-83f0-75ef85b18f84/original/manifest.json',
      name: 'Ryan',
      description: 'Confiant, clair, voix masculine française',
      language: 'fr-FR',
    },
    emily: {
      provider: 'playht' as const,
      voiceId: 's3://voice-cloning-zero-shot/baf1d117-7704-4f1c-8ab8-e6916a5c0dee/female-classy/manifest.json',
      name: 'Emily',
      description: 'Élégante, posée, voix féminine française',
      language: 'fr-FR',
    },
  },

  // Azure Voices (Excellent Quality for French)
  azure: {
    denise: {
      provider: 'azure' as const,
      voiceId: 'fr-FR-DeniseNeural',
      name: 'Denise',
      description: 'Naturelle, professionnelle, voix féminine française',
      language: 'fr-FR',
    },
    henri: {
      provider: 'azure' as const,
      voiceId: 'fr-FR-HenriNeural',
      name: 'Henri',
      description: 'Professionnel, rassurant, voix masculine française',
      language: 'fr-FR',
    },
  },
};

/**
 * ============================================================================
 * SYSTEM PROMPT TEMPLATES
 * ============================================================================
 */

export const PROMPT_TEMPLATES = {
  secretary: `You are a professional executive secretary AI assistant. Your role is to:
- Answer calls politely and professionally
- Screen calls and gather information
- Schedule appointments and manage calendars
- Take detailed messages
- Handle routine inquiries

Always be courteous, efficient, and maintain confidentiality.`,

  sales: `You are a friendly sales representative AI. Your role is to:
- Qualify leads with targeted questions
- Understand customer needs
- Present product benefits clearly
- Handle objections gracefully
- Schedule demo calls or follow-ups

Be enthusiastic but not pushy. Listen more than you talk.`,

  support: `You are a helpful customer support AI agent. Your role is to:
- Resolve customer issues efficiently
- Provide clear, step-by-step guidance
- Escalate complex problems when needed
- Maintain a positive, empathetic tone
- Follow up to ensure satisfaction

Prioritize customer happiness above all else.`,

  custom: `You are an AI voice assistant. Follow these instructions carefully:

[CUSTOM INSTRUCTIONS WILL BE INSERTED HERE]

Always maintain professionalism and clarity in communication.`,
};

export default vapi;
