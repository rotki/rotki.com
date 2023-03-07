class AssertionError extends Error {
  constructor() {
    super();
    this.name = 'AssertionError';
  }
}

export function assert(condition: any, msg?: string): asserts condition {
  if (!condition) {
    throw new AssertionError(msg ?? 'AssertionError');
  }
}
