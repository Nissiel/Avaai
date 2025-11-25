import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5555";

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("Authorization");

    if (!authHeader) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    console.log("[setup-status] Fetching from backend:", BACKEND_URL);

    // Helper to fetch with timeout
    const fetchWithTimeout = async (url: string, timeoutMs: number = 5000) => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      try {
        const response = await fetch(url, {
          headers: { Authorization: authHeader },
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
        return response;
      } catch (e: unknown) {
        clearTimeout(timeoutId);
        const errorMessage = e instanceof Error ? e.message : 'Unknown error';
        console.error(`[setup-status] ${url} error:`, errorMessage);
        return null;
      }
    };

    // Fetch all data in parallel with individual timeouts
    // Business and phone are fast (2s timeout), assistants needs Vapi API (5s timeout)
    const [businessResponse, phoneResponse, assistantsResponse] = await Promise.all([
      fetchWithTimeout(`${BACKEND_URL}/api/v1/business-profile`, 2000),
      fetchWithTimeout(`${BACKEND_URL}/api/v1/phone-numbers/my-numbers`, 2000),
      fetchWithTimeout(`${BACKEND_URL}/api/v1/assistants`, 5000),
    ]);

    console.log("[setup-status] Responses:", {
      business: businessResponse?.status,
      phone: phoneResponse?.status,
      assistants: assistantsResponse?.status,
    });

    let profileCompleted = false;
    let phoneConfigured = false;
    let assistantCreated = false;

    // Check business profile - completed if company_name is set
    if (businessResponse?.ok) {
      try {
        const business = await businessResponse.json();
        console.log("[setup-status] Business profile:", { company_name: business.company_name });
        profileCompleted = Boolean(business.company_name);
      } catch (e) {
        console.error("[setup-status] business JSON error:", e);
      }
    }

    // Check phone numbers - configured if at least one exists
    if (phoneResponse?.ok) {
      try {
        const data = await phoneResponse.json();
        // Response format: { success: true, numbers: [...], count: N }
        const numbers = data.numbers || data;
        console.log("[setup-status] Phone numbers count:", Array.isArray(numbers) ? numbers.length : 0);
        phoneConfigured = Array.isArray(numbers) && numbers.length > 0;
      } catch (e) {
        console.error("[setup-status] phone JSON error:", e);
      }
    }

    // Check assistants - created if at least one exists
    if (assistantsResponse?.ok) {
      try {
        const data = await assistantsResponse.json();
        // Response format: { success: true, assistants: [...] }
        const assistants = data.assistants || data;
        console.log("[setup-status] Assistants count:", Array.isArray(assistants) ? assistants.length : 0);
        assistantCreated = Array.isArray(assistants) && assistants.length > 0;
      } catch (e) {
        console.error("[setup-status] assistants JSON error:", e);
      }
    }

    console.log("[setup-status] Final result:", { profileCompleted, phoneConfigured, assistantCreated });

    return NextResponse.json({
      profile_completed: profileCompleted,
      phone_configured: phoneConfigured,
      assistant_created: assistantCreated,
    });
  } catch (error) {
    console.error("Error fetching setup status:", error);
    // Return defaults on error instead of failing
    return NextResponse.json({
      profile_completed: false,
      phone_configured: false,
      assistant_created: false,
    });
  }
}
