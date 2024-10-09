import type { Space } from "../types.ts";
import { kv } from "./kv.ts";

export const keys = {
  byId: (id: string) => ["spaces", id],
  byName: (name: string) => ["spaces_by_name", name],
  byOwner: (username: string, id: string) => ["spaces_by_owner", username, id],
};

export function setSpace(space: Space, atomic = kv.atomic()) {
  return atomic
    .set(keys.byId(space.id), space)
    .set(keys.byName(space.name), space)
    .set(keys.byOwner(space.ownerUsername, space.id), space);
}

export function deleteSpace(space: Space, atomic = kv.atomic()) {
  return atomic
    .delete(keys.byId(space.id))
    .delete(keys.byName(space.name))
    .delete(keys.byOwner(space.ownerUsername, space.id));
}

export function getSpaceById(
  spaceId: string,
  options?: { consistency?: Deno.KvConsistencyLevel },
) {
  return kv.get<Space>(keys.byId(spaceId), options);
}

export function getSpaceByName(
  name: string,
  options?: { consistency?: Deno.KvConsistencyLevel },
) {
  return kv.get<Space>(keys.byName(name), options);
}

export async function listSpacesByOwner(
  ownerId: string,
  options?: Deno.KvListOptions,
) {
  const prefix = keys.byOwner(ownerId, "").slice(0, -1);
  const iter = kv.list<Space>({ prefix }, options);
  return (await Array.fromAsync(iter)).map((x) => x.value);
}
