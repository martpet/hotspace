import type { GetObjectOptions } from "./get_object.ts";
import { getObject } from "./get_object.ts";

export function headObject(options: Omit<GetObjectOptions, "head">) {
  return getObject({ head: true, ...options });
}
