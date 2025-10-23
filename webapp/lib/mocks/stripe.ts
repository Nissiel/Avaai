export interface CheckoutSession {
  id: string;
  url: string;
}

export async function createCheckoutSession(plan: string): Promise<CheckoutSession> {
  return {
    id: `cs_${plan}_${Date.now()}`,
    url: `https://billing.example.com/checkout?plan=${plan}`,
  };
}

export async function billingPortal(): Promise<{ url: string }> {
  return { url: "https://billing.example.com/portal" };
}
