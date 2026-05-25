import { NextResponse } from "next/server";
import { getManualPaymentConfig, getPaystackPublicKey, isPaystackConfigured } from "@/lib/payment-config";

export async function GET() {
  const manual = getManualPaymentConfig();
  return NextResponse.json({
    manual: {
      accountName: manual.accountName,
      accountNumber: manual.accountNumber,
      bankName: manual.bankName,
      contactUrl: manual.contactUrl,
    },
    paystack: {
      enabled: isPaystackConfigured(),
      publicKey: getPaystackPublicKey() || null,
    },
  });
}
