export class AsyncQueue<T> {
  #queue: (() => Promise<void>)[] = [];
  #processing = false;

  add(task: () => Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      this.#queue.push(async () => {
        try {
          resolve(await task());
        } catch (error) {
          reject(error);
        }
      });
      if (!this.#processing) {
        this.process();
      }
    });
  }

  process() {
    this.#processing = true;
    while (this.#queue.length > 0) {
      const task = this.#queue.shift();
      if (task) {
        task();
      }
    }
    this.#processing = false;
  }
}
