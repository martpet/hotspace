import { fetchWithRetry } from "$util";
import { HEADER } from "@std/http/unstable-header";
import { STRIPE_BASE_URL } from "../const.ts";
import { StripeError, StrypePaymentIntent } from "../types.ts";

interface Options {
  secret: string;
  amount: number;
  currency: string;
  metadata?: Record<string, unknown>;
}

export async function createPaymentIntent(
  options: Options,
): Promise<StrypePaymentIntent | StripeError> {
  const { secret, amount, currency, metadata } = options;
  const url = STRIPE_BASE_URL + "/payment_intents";

  const payload = new URLSearchParams({
    amount: String(amount),
    currency,
  });

  if (metadata) {
    for (const [key, val] of Object.entries(metadata)) {
      payload.set(`metadata[${key}]`, String(val));
    }
  }

  const req = new Request(url, {
    method: "post",
    body: payload,
    headers: {
      "Authorization": `Bearer ${secret}`,
      "Idempotency-Key": crypto.randomUUID(),
      [HEADER.ContentType]: "application/x-www-form-urlencoded",
    },
  });

  try {
    const resp = await fetchWithRetry(req);
    const respData = await resp.json();
    return respData;
  } catch (err) {
    return {
      error: {
        type: "fetch_error",
        message: (err as Error).message,
      },
    };
  }
}
