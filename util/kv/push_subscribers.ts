import type { PushSubscriber } from "../types.ts";
import { kv } from "./kv.ts";

export const keys = {
  byId: (subscriberId: string) => ["subscribers", subscriberId],
};

export function setSubscriber(
  subscriber: PushSubscriber,
  atomic = kv.atomic(),
) {
  return atomic.set(keys.byId(subscriber.id), subscriber);
}

export function getSubscriber(subscriberId: string) {
  return kv.get<PushSubscriber>(keys.byId(subscriberId));
}
