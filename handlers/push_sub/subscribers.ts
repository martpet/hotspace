import { STATUS_CODE } from "@std/http";
import { ulid } from "@std/ulid";
import { PUSH_SUB_HOSTS } from "../../util/consts.ts";
import {
  getSubscriber,
  setSubscriber,
} from "../../util/kv/push_subscribers.ts";
import type { AppContext, PushSub } from "../../util/types.ts";

type RequestData = {
  pushSub: PushSub;
  subscriberId?: string;
} | {
  pushSub: null;
  subscriberId: string;
};

export default async function subscribersHandler(ctx: AppContext) {
  const { user } = ctx.state;
  const reqData = await ctx.req.json();

  if (!isReqDataValid(reqData)) {
    return ctx.respond(null, STATUS_CODE.BadRequest);
  }

  const { subscriberId, pushSub } = reqData;

  let subscriberEntry;

  if (subscriberId) {
    subscriberEntry = await getSubscriber(subscriberId);
    if (!subscriberEntry.value) {
      return ctx.respond(null, STATUS_CODE.UnprocessableEntity);
    }
  }

  const currrentSubscriber = subscriberEntry?.value;

  const isNewEndpoint = pushSub?.endpoint &&
    pushSub.endpoint !== currrentSubscriber?.pushSub?.endpoint;

  if (isNewEndpoint && !await isEndpointValid(pushSub)) {
    return ctx.respond(null, STATUS_CODE.Forbidden);
  }

  const pushSubUpdatedAt = !currrentSubscriber ||
      currrentSubscriber.pushSub?.endpoint !== pushSub?.endpoint
    ? new Date()
    : currrentSubscriber.pushSubUpdatedAt;

  const subscriber = {
    id: subscriberEntry?.value?.id || ulid(),
    pushSub,
    pushSubUpdatedAt,
    userId: user?.id,
  };

  const atomic = setSubscriber(subscriber);

  if (subscriberEntry) {
    atomic.check(subscriberEntry);
  }

  const commit = await atomic.commit();

  if (!commit.ok) {
    return ctx.respond(null, STATUS_CODE.Conflict);
  }

  return ctx.json(subscriber);
}

function isReqDataValid(data: unknown): data is RequestData {
  const { pushSub, subscriberId } = data as Partial<RequestData>;
  if (typeof data !== "object") {
    return false;
  }
  if (pushSub) {
    return typeof pushSub.endpoint === "string" &&
      typeof pushSub.keys?.auth === "string" &&
      typeof pushSub.keys.p256dh === "string" &&
      (subscriberId === undefined || typeof subscriberId === "string");
  }
  return pushSub === null && typeof subscriberId === "string";
}

async function isEndpointValid(pushSub: PushSub) {
  const url = new URL(pushSub.endpoint);
  const isHostValid = PUSH_SUB_HOSTS.some((host) => url.host.endsWith(host));
  if (!isHostValid) return false;
  const { sendTestPushNotification } = await import("../../util/webpush.ts");
  try {
    await sendTestPushNotification(pushSub);
    return true;
  } catch (err) {
    console.error("Subscriber test push notification", err);
    return false;
  }
}
