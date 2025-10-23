/**
 * ============================================================================
 * VAPI ASSISTANTS API ROUTE
 * ============================================================================
 * Handles assistant creation, updates, and management
 * ============================================================================
 */

import { NextRequest, NextResponse } from 'next/server';
import { vapi, createAvaAssistant } from '@/lib/vapi/client';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, voice, personality, instructions, phoneNumber } = body;

    // Validate required fields
    if (!name || !instructions || !phoneNumber) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create assistant using Vapi
    const result = await createAvaAssistant({
      name,
      firstMessage: `Bonjour, je suis ${name}. Comment puis-je vous aider ?`,
      systemPrompt: instructions,
      voice: voice || 'jennifer-playht',
      model: {
        provider: 'openai',
        model: 'gpt-4',
      },
      functions: [], // Can be customized per user needs
    });

    if (!result.success) {
      throw new Error(result.error);
    }

    return NextResponse.json({
      success: true,
      assistant: {
        id: result.assistant.id,
        name: result.assistant.name,
        phoneNumber,
      },
    });
  } catch (error: any) {
    console.error('Error creating assistant:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create assistant' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const assistantId = searchParams.get('id');

    if (assistantId) {
      // Get specific assistant
      const assistant = await vapi.assistants.get(assistantId);
      return NextResponse.json({ success: true, assistant });
    } else {
      // List all assistants
      const assistants = await vapi.assistants.list();
      return NextResponse.json({ success: true, assistants });
    }
  } catch (error: any) {
    console.error('Error fetching assistants:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Assistant ID required' },
        { status: 400 }
      );
    }

    const assistant = await vapi.assistants.update(id, updates);

    return NextResponse.json({ success: true, assistant });
  } catch (error: any) {
    console.error('Error updating assistant:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Assistant ID required' },
        { status: 400 }
      );
    }

    await vapi.assistants.delete(id);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting assistant:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
