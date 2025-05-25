import { createPaymentIntent } from "$stripe";
import { pick } from "@std/collections/pick";
import { STATUS_CODE } from "@std/http";
import {
  isProd,
  PRICE_PER_GB_CENTS,
  STRIPE_SECRET,
} from "../../util/consts.ts";
import { setPaymentIntent } from "../../util/kv/payments.ts";
import type { AppContext, Product } from "../../util/types.ts";

export default async function createPaymentIntentHandler(ctx: AppContext) {
  const { user } = ctx.state;

  if (!user) {
    return ctx.respond(null, STATUS_CODE.Unauthorized);
  }

  const { quantity } = await ctx.req.json();

  if (typeof quantity !== "number" || quantity === 0) {
    return ctx.respond(null, STATUS_CODE.BadRequest);
  }

  const amount = PRICE_PER_GB_CENTS * quantity;
  const product: Product = "upload_traffic_1_gb";
  const userId = user.id;

  const result = await createPaymentIntent({
    secret: STRIPE_SECRET,
    amount,
    currency: "usd",
    metadata: {
      appUrl: ctx.url.origin,
    },
  });

  if (result.error) {
    const { error } = result;
    if (error.type !== "card_error" && isProd) {
      error.type = "sanitized";
    }
    return ctx.respondJson({ error });
  }

  await setPaymentIntent({
    stripeIntentId: result.id,
    userId,
    product,
    quantity,
    amount,
  }).commit();

  return ctx.respondJson(pick(result, ["client_secret"]));
}
