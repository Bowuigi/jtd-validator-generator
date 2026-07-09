import { assertEquals, assertFalse } from "@std/assert";
import { generateCode, type Schema } from '../mod.ts';

export type ValidationResult =
  | { success: true }
  | { success: false, errors: Array<{ path: Array<string | number>, message: string, suggestions: Array<string> }> };

export async function testValidatorGeneration(schema: Schema, data: unknown): Promise<ValidationResult> {
  const code = generateCode(schema);
  const blob = new Blob([code], { type: "application/typescript" });
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
  expectedErrors?: Array<{ path: Array<string | number>; message: string; suggestions: Array<string> }>,
): void {
  Deno.test(name, async () => {
    const result = await testValidatorGeneration(schema, data);
    if (expectedErrors === undefined) {
      assertEquals(result, { success: true });
    } else {
      assertFalse(result.success);
      assertEquals(result.errors, expectedErrors);
    }
  });
}
