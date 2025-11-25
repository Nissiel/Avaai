import { NextResponse } from "next/server";

/**
 * Development bypass helpers for API routes
 * Returns mock responses when NEXT_PUBLIC_DEV_BYPASS_AUTH=true
 */

export function isDevBypassEnabled(): boolean {
  return process.env.NEXT_PUBLIC_DEV_BYPASS_AUTH === "true";
}

export const DEV_MOCK_USER = {
  id: "dev-user-avner",
  email: "addavner@gmail.com",
  name: "Avner (Dev Mode)",
  image: null,
  locale: "en",
  phone: null,
  onboarding_completed: true,
  onboarding_step: 5,
  phone_verified: false,
};

export const DEV_MOCK_TOKENS = {
  access_token: "dev-bypass-mock-token",
  refresh_token: "dev-bypass-mock-refresh-token",
  expires_in: 86400, // 24 hours
  token_type: "Bearer",
};

export function createMockLoginResponse() {
  console.log("🔓 DEV BYPASS: Returning mock login response");

  const response = NextResponse.json(
    {
      ...DEV_MOCK_TOKENS,
      user: DEV_MOCK_USER,
    },
    { status: 200 }
  );

  // Set cookies
  response.cookies.set("access_token", DEV_MOCK_TOKENS.access_token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60,
    path: "/",
  });

  response.cookies.set("refresh_token", DEV_MOCK_TOKENS.refresh_token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 30 * 24 * 60 * 60,
    path: "/",
  });

  return response;
}

export function createMockMeResponse() {
  console.log("🔓 DEV BYPASS: Returning mock /me response");

  return NextResponse.json(DEV_MOCK_USER, { status: 200 });
}

export function createMockRefreshResponse() {
  console.log("🔓 DEV BYPASS: Returning mock refresh response");

  const response = NextResponse.json(
    {
      ...DEV_MOCK_TOKENS,
      user: DEV_MOCK_USER,
    },
    { status: 200 }
  );

  // Update access token cookie
  response.cookies.set("access_token", DEV_MOCK_TOKENS.access_token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60,
    path: "/",
  });

  return response;
}

/**
 * Mock data generators for dashboard endpoints
 */

export function createMockAnalyticsOverview() {
  console.log("🔓 DEV BYPASS: Returning mock analytics overview");

  return NextResponse.json(
    {
      success: true,
      overview: {
        totalCalls: 42,
        avgDurationSeconds: 180,
        totalCost: 12.50,
      },
      calls: [
        {
          id: "call-1",
          customerNumber: "+1234567890",
          status: "completed",
          startedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          durationSeconds: 240,
          cost: 0.50,
        },
        {
          id: "call-2",
          customerNumber: "+0987654321",
          status: "completed",
          startedAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
          durationSeconds: 180,
          cost: 0.40,
        },
      ],
      topics: [],
    },
    { status: 200 }
  );
}

export function createMockAssistantsResponse() {
  console.log("🔓 DEV BYPASS: Returning mock assistants");

  return NextResponse.json(
    {
      assistants: [
        {
          id: "asst-1",
          name: "AVA Sales Assistant (Dev)",
          transcriber: {
            provider: "deepgram",
            model: "nova-2",
            language: "en",
          },
          model: {
            provider: "openai",
            model: "gpt-4",
            temperature: 0.7,
          },
          voice: {
            provider: "11labs",
            voiceId: "rachel",
          },
          firstMessage: "Hi! How can I help you today?",
        },
      ],
      configured: true,
    },
    { status: 200 }
  );
}

export function createMockBusinessProfileResponse() {
  console.log("🔓 DEV BYPASS: Returning mock business profile");

  return NextResponse.json(
    {
      id: "profile-1",
      user_id: "dev-user-avner",
      business_name: "Avner's Dev Company",
      business_phone: "+1234567890",
      business_email: "addavner@gmail.com",
      business_address: "123 Dev Street",
      timezone: "America/New_York",
      locale: "en",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    { status: 200 }
  );
}
