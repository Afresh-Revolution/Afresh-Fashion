function stripQuotes(value: string | undefined): string {
  if (!value) return "";
  return value.replace(/^["']|["']$/g, "").trim();
}

export function getManualPaymentConfig() {
  return {
    accountName: stripQuotes(process.env.MANUAL_PAYMENT_ACCOUNT_NAME) || "AFRESH BIZ & ENT LTD",
    accountNumber: stripQuotes(process.env.MANUAL_PAYMENT_ACCOUNT_NUMBER) || "",
    bankName: stripQuotes(process.env.MANUAL_PAYMENT_BANK_NAME) || "Fidelity bank",
    contactUrl: stripQuotes(process.env.MANUAL_PAYMENT_CONTACT_URL) || "",
  };
}

export function getPaystackPublicKey() {
  return stripQuotes(process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY);
}

export function getPaystackSecretKey() {
  return stripQuotes(process.env.PAYSTACK_SECRET_KEY);
}

export function isPaystackConfigured() {
  return Boolean(getPaystackSecretKey() && getPaystackPublicKey());
}
