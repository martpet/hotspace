import type { Subscriber } from "../types.ts";
import { kv } from "./kv.ts";

export const keys = {
  byId: (id: string) => ["subscribers", id],
};

export function setSubscriber(subscriber: Subscriber, atomic = kv.atomic()) {
  return atomic.set(keys.byId(subscriber.id), subscriber);
}

export function getSubscriber(id: string) {
  return kv.get<Subscriber>(keys.byId(id));
}
