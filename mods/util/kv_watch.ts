import { MaybePromise } from "./types.ts";

export interface KvWatchOptions<T extends unknown[]> {
  kv: Deno.Kv;
  kvKeys: [...{ [K in keyof T]: Deno.KvKey }];
  onEntries: (
    arg: { [K in keyof T]: Deno.KvEntryMaybe<T[K]> },
  ) => MaybePromise<void>;
}

export function kvWatch<T extends unknown[]>(opt: KvWatchOptions<T>) {
  const { kv, kvKeys, onEntries } = opt;
  const reader = kv.watch<T>(kvKeys).getReader();

  (async () => {
    while (true) {
      const result = await reader.read();
      if (result.done) break;
      await onEntries(result.value);
    }
  })();

  return reader;
}
