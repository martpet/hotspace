import type { PushSubscriber } from "../types.ts";
import { kv } from "./kv.ts";

export const keys = {
  byId: (subscriberId: string) => ["subscribers", subscriberId],
  byUserId: (
    userId: string,
    subscriberId: string,
  ) => ["subscribers_by_user", userId, subscriberId],
};

export function setSubscriber(
  subscriber: PushSubscriber,
  atomic = kv.atomic(),
) {
  atomic.set(keys.byId(subscriber.id), subscriber);
  if (subscriber.userId) {
    atomic.set(keys.byUserId(subscriber.userId, subscriber.id), subscriber);
  }
  return atomic;
}

export function getSubscriber(subscriberId: string) {
  return kv.get<PushSubscriber>(keys.byId(subscriberId));
}

export async function listSubscribersByUserId(userId: string) {
  const iter = kv.list<PushSubscriber>({
    prefix: keys.byUserId(userId, "").slice(0, -1),
  });
  return (await Array.fromAsync(iter)).map(({ value }) => value);
}

export function deleteSubscriberByUserId(userId: string, subscriberId: string) {
  return kv.delete(keys.byUserId(userId, subscriberId));
}
