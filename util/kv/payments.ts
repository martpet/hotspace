import { WEEK } from "@std/datetime/constants";
import type { Payment, PaymentIntent } from "../types.ts";
import { kv } from "./kv.ts";

export const keys = {
  byId: (id: string) => ["payments", id],
  byUser: (userId: string, id: string) => ["payments_by_user", userId, id],
  byIntent: (intentId: string) => ["payments_by_intent", intentId],
};

const paymentIntentKey = {
  byStripeId: (intentId: string) => ["payment_intents", intentId],
  byUser: (
    userId: string,
    intentId: string,
  ) => ["payment_intents_by_user", userId, intentId],
};

export function setPayment(payment: Payment, atomic = kv.atomic()) {
  return atomic
    .set(keys.byId(payment.id), payment)
    .set(keys.byUser(payment.userId, payment.id), payment)
    .set(keys.byIntent(payment.stripeIntentId), payment.id);
}

export function deletePayment(payment: Payment, atomic = kv.atomic()) {
  return atomic
    .delete(keys.byId(payment.id))
    .delete(keys.byUser(payment.userId, payment.id))
    .delete(keys.byIntent(payment.stripeIntentId));
}

export function listPaymentsByUser(userId: string) {
  const prefix = keys.byUser(userId, "").slice(0, -1);
  const iter = kv.list<Payment>({ prefix });
  return Array.fromAsync(iter, (it) => it.value);
}

export function setPaymentIntent(
  intent: PaymentIntent,
  atomic = kv.atomic(),
) {
  const { userId, stripeIntentId } = intent;
  const expireIn = WEEK * 4;

  return atomic
    .set(paymentIntentKey.byStripeId(stripeIntentId), intent, { expireIn })
    .set(paymentIntentKey.byUser(userId, stripeIntentId), intent, { expireIn });
}

export function deletePaymentIntent(
  intent: PaymentIntent,
  atomic = kv.atomic(),
) {
  const { userId, stripeIntentId } = intent;
  return atomic
    .delete(paymentIntentKey.byStripeId(stripeIntentId))
    .delete(paymentIntentKey.byUser(userId, stripeIntentId));
}

export function getPaymentIntent(intentId: string) {
  return kv.get<PaymentIntent>(paymentIntentKey.byStripeId(intentId));
}

export function listPaymentIntentsByUser(userId: string) {
  const prefix = paymentIntentKey.byUser(userId, "").slice(0, -1);
  const iter = kv.list<PaymentIntent>({ prefix });
  return Array.fromAsync(iter, (it) => it.value);
}
