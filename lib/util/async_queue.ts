export class AsyncQueue {
  #queue: (() => Promise<unknown>)[] = [];
  #processing = false;
  #locked = false;

  add<T>(task: () => Promise<T> | T): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      this.#queue.push(async () => {
        try {
          const result = await task();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });
      if (!this.#processing && !this.#locked) {
        this.process();
      }
    });
  }

  async process() {
    this.#processing = true;
    while (this.#queue.length > 0) {
      if (this.#locked) {
        this.#processing = false;
        return;
      }
      const task = this.#queue.shift();
      if (task) {
        await task();
      }
    }
    this.#processing = false;
  }

  lock() {
    this.#locked = true;
    return this;
  }

  releaseLock() {
    if (this.#locked) {
      this.#locked = false;
      if (!this.#processing) {
        this.process();
      }
    }
    return this;
  }
}
