export function uuid() {
  return crypto
    .randomUUID()
    .split("-")
    .map((x) => parseInt(x, 16).toString(36))
    .join("");
}

export class LazyCell<T> {
  private promise: Promise<T>;
  private resolved: boolean = false;
  private resolve!: (value: T) => void;
  private reject!: (err: any) => void;

  constructor(private fn: () => T | Promise<T>) {
    this.promise = new Promise((resolve, reject) => {
      this.resolve = resolve;
      this.reject = reject;
    });
  }

  get(init: boolean = true): Promise<T> {
    if (init && !this.resolved) {
      Promise.resolve(this.fn()).then(this.resolve, this.reject);
    }

    return this.promise;
  }
}

export function diceSort(a: [number, number], b: [number, number]) {
  const sum = (arr: number[]) => arr.reduce((sum, n) => sum + n, 0);
  return sum(b) - sum(a);
}
