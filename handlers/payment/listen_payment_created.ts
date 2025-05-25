import { format } from "@std/fmt/bytes";
import { STATUS_CODE } from "@std/http/status";
import { kv } from "../../util/kv/kv.ts";
import { keys as getPaymentKey } from "../../util/kv/payments.ts";
import { getRemainingUploadBytesByUser } from "../../util/kv/upload_stats.ts";
import type { AppContext, Payment } from "../../util/types.ts";

export default function listenPaymentCreatedHandler(ctx: AppContext) {
  const { user } = ctx.state;
  const { paymentIntentId } = ctx.urlPatternResult.pathname.groups;

  if (!user) {
    return ctx.respond(null, STATUS_CODE.Unauthorized);
  }

  if (!paymentIntentId) {
    return ctx.respond(null, STATUS_CODE.BadRequest);
  }

  return ctx.respondKvWatchSse<[Payment]>({
    kv,
    kvKeys: [getPaymentKey.byIntent(paymentIntentId)],
    async onEntries({ entries, sendMsg }) {
      const payment = entries[0].value;
      if (!payment) return;
      const uploadQuotaBytes = await getRemainingUploadBytesByUser(user.id);
      sendMsg({
        ok: true,
        uploadQuota: format(uploadQuotaBytes),
      });
    },
  });
}
