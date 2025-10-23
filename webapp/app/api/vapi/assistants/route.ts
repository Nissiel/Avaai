/**
 * ============================================================================
 * VAPI ASSISTANTS API ROUTE
 * ============================================================================
 * Validates requests and proxies to the Vapi SDK with strict typing.
 * ============================================================================
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import {
  createAvaAssistant,
  isVapiConfigured,
  updateAvaAssistant,
  vapi,
} from "@/lib/vapi/client";
import {
  createAssistantSchema,
  type AssistantVoiceInput,
  updateAssistantSchema,
} from "@/lib/validations/assistants";

const assistantIdSchema = z.string().min(1, "Assistant id is required");

function ensureVapi() {
  if (!isVapiConfigured()) {
    return NextResponse.json(
      { success: false, error: "Vapi client not configured" },
      { status: 503 },
    );
  }
  return null;
}

export async function POST(request: NextRequest) {
  const configError = ensureVapi();
  if (configError) return configError;

  try {
    const json = await request.json();
    const parsed = createAssistantSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid assistant payload",
          issues: parsed.error.flatten(),
        },
        { status: 400 },
      );
    }

    const { name, instructions, firstMessage, voice, model, functions, metadata, phoneNumber } =
      parsed.data;

    const normalizedVoice = voice as AssistantVoiceInput;

    const personaSuffix = metadata?.personality
      ? `\n\nPersona attendue: ${metadata.personality}`
      : "";

    const createResult = await createAvaAssistant({
      name,
      systemPrompt: `${instructions}${personaSuffix}`,
      firstMessage,
      voice: normalizedVoice,
      model: model ?? {
        provider: "openai",
        model: "gpt-4o-mini",
        temperature: 0.7,
        maxTokens: 500,
      },
      functions,
    });

    if (!createResult.success) {
      return NextResponse.json(
        { success: false, error: createResult.error },
        { status: 502 },
      );
    }

    return NextResponse.json({
      success: true,
      assistant: createResult.assistant,
      phoneNumber,
    });
  } catch (error) {
    console.error("Error creating assistant:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create assistant" },
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest) {
  const configError = ensureVapi();
  if (configError) return configError;

  try {
    const searchParams = request.nextUrl.searchParams;
    const assistantId = searchParams.get("id");

    if (assistantId) {
      const idResult = assistantIdSchema.safeParse(assistantId);
      if (!idResult.success) {
        return NextResponse.json(
          { success: false, error: "Invalid assistant id" },
          { status: 400 },
        );
      }

      const assistant = await vapi.assistants.get(assistantId);
      return NextResponse.json({ success: true, assistant });
    }

    const assistants = await vapi.assistants.list({ limit: 50 });
    return NextResponse.json({ success: true, assistants });
  } catch (error) {
    console.error("Error fetching assistants:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch assistants" },
      { status: 500 },
    );
  }
}

export async function PATCH(request: NextRequest) {
  const configError = ensureVapi();
  if (configError) return configError;

  try {
    const json = await request.json();
    const parsed = updateAssistantSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid assistant update payload",
          issues: parsed.error.flatten(),
        },
        { status: 400 },
      );
    }

    const { id, instructions, model, functions, ...rest } = parsed.data;

    const updateResult = await updateAvaAssistant(id, {
      ...rest,
      ...(instructions && { systemPrompt: instructions }),
      ...(model && { model }),
      ...(functions && { functions }),
    });

    if (!updateResult.success) {
      return NextResponse.json(
        { success: false, error: updateResult.error },
        { status: 502 },
      );
    }

    return NextResponse.json({ success: true, assistant: updateResult.assistant });
  } catch (error) {
    console.error("Error updating assistant:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update assistant" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  const configError = ensureVapi();
  if (configError) return configError;

  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get("id");

    const parsed = assistantIdSchema.safeParse(id);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Assistant id is required" },
        { status: 400 },
      );
    }

    await vapi.assistants.delete(parsed.data);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting assistant:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete assistant" },
      { status: 500 },
    );
  }
}
