export type ParamsWatchKv<T extends unknown[]> = [
  kv: Deno.Kv,
  keys: readonly [...{ [K in keyof T]: Deno.KvKey }],
  callback: (value: { [K in keyof T]: Deno.KvEntryMaybe<T[K]> }) => void,
];

export function watchKv<T extends unknown[]>(
  ...[kv, keys, callback]: ParamsWatchKv<T>
) {
  const reader = kv.watch<T>(keys).getReader();

  (async () => {
    while (true) {
      const result = await reader.read();
      if (result.done) break;
      callback(result.value);
    }
  })();

  return reader;
}
