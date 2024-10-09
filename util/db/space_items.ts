import type { SpaceItem } from "../types.ts";
import { kv } from "./kv.ts";

export const keys = {
  byId: (id: string) => ["space_items", id],
  byName: (name: string) => ["space_items_by_name", name],
  bySpaceById: (spaceId: string, id: string) => ["space_items", spaceId, id],
};

export function getSpaceItemById(id: string) {
  return kv.get<SpaceItem>(keys.byId(id));
}
