declare global {
  interface Array<T> {
    remove(value: T): number;
  }
}
