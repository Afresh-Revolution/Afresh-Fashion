import { getPaystackSecretKey } from "@/lib/payment-config";
import { getSiteUrl } from "@/lib/resend";

type InitResponse = {
  status: boolean;
  message: string;
  data?: {
    authorization_url: string;
    access_code: string;
    reference: string;
  };
};

type VerifyResponse = {
  status: boolean;
  message: string;
  data?: {
    status: string;
    reference: string;
    amount: number;
  };
};

export async function paystackInitialize(opts: {
  email: string;
  amountNgn: number;
  reference: string;
  metadata?: Record<string, string>;
}) {
  const secret = getPaystackSecretKey();
  if (!secret) throw new Error("Paystack is not configured");

  const siteUrl = getSiteUrl();

  const res = await fetch("https://api.paystack.co/transaction/initialize", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secret}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: opts.email,
      amount: Math.round(opts.amountNgn * 100),
      currency: "NGN",
      reference: opts.reference,
      callback_url: `${siteUrl}/order/complete?reference=${encodeURIComponent(opts.reference)}`,
      metadata: opts.metadata,
    }),
  });

  const data = (await res.json()) as InitResponse;
  if (!res.ok || !data.status || !data.data?.authorization_url) {
    throw new Error(data.message || "Could not start Paystack payment");
  }
  return data.data;
}

export async function paystackVerify(reference: string) {
  const secret = getPaystackSecretKey();
  if (!secret) throw new Error("Paystack is not configured");

  const res = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
    headers: { Authorization: `Bearer ${secret}` },
  });

  const data = (await res.json()) as VerifyResponse;
  if (!res.ok || !data.status) {
    throw new Error(data.message || "Payment verification failed");
  }
  return data.data;
}

export function buildPaystackReference(orderNumber: string) {
  return `AFR-${orderNumber}-${Date.now()}`.replace(/[^a-zA-Z0-9-_]/g, "-");
}
