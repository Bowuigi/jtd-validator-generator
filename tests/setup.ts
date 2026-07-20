import { generateCode } from '../src/lib.ts';
import type { Schema } from '../src/types.ts';

export type { Schema };

// deno-lint-ignore no-external-import
import { test } from 'node:test';
// deno-lint-ignore no-external-import
import * as assert from 'node:assert';

export type ValidationResult =
  | { success: true }
  | {
    success: false,
    errors: Array<{ path: Array<string | number>, message: string, suggestions: Array<string> }>
  };

export async function testValidatorGeneration(
  schema: Schema,
  data: unknown
): Promise<ValidationResult> {
  const code = generateCode(schema);
  const blob = new Blob([code], { type: 'application/typescript' });
  const url = URL.createObjectURL(blob);
  const { validate }: { validate: (data: unknown) => ValidationResult } = await import(url);
  const validationResult = validate(data);
  URL.revokeObjectURL(url);
  return validationResult;
}

export function testCase(
  name: string,
  schema: Schema,
  data: unknown,
  expectedErrors?: Array<
    { path: Array<string | number>, message: string, suggestions: Array<string> }
  >
): void {
  test(name, { plan: 1 }, async () => {
    const result = await testValidatorGeneration(schema, data);
    if (expectedErrors === undefined) {
      assert.deepStrictEqual(result, { success: true });
    } else {
      assert.deepStrictEqual(result, { success: false, errors: expectedErrors });
    }
  });
}
