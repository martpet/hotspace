import type { PushSubscriber } from "../types.ts";
import { kv } from "./kv.ts";

export const keys = {
  byId: (id: string) => ["subscribers", id],
};

export function setSubscriber(
  subscriber: PushSubscriber,
  atomic = kv.atomic(),
) {
  return atomic.set(keys.byId(subscriber.id), subscriber);
}

export function getSubscriber(id: string) {
  return kv.get<PushSubscriber>(keys.byId(id));
}
