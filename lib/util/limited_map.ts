export class LimitedMap<K, V> extends Map<K, V> {
  #maxSize: number;

  constructor(maxSize: number, entries?: [K, V][]) {
    super(entries);
    this.#maxSize = maxSize;
  }

  override set(key: K, value: V) {
    if (this.size >= this.#maxSize) {
      const firstKey = this.keys().next().value;
      this.delete(firstKey!);
    }
    return super.set(key, value);
  }
}
