declare module 'node:test' {
  export interface TestContext {}

  export type TestFn = (name: string, fn: (t: TestContext) => void | Promise<void>) => void;

  const test: TestFn;
  export default test;
}

declare module 'node:assert/strict' {
  export interface Assert {
    equal(actual: unknown, expected: unknown, message?: string): void;
    deepEqual(actual: unknown, expected: unknown, message?: string): void;
    match(actual: string, expected: RegExp, message?: string): void;
    ok(value: unknown, message?: string): void;
  }

  const assert: Assert;
  export default assert;
}
