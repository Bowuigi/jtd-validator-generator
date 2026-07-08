import { generateCode } from '../mod.ts';

// Note that the test's output type is meant to be the following:
export type ValidationResult =
  | { success: true }
  | { success: false, errors: Array<{ path: Array<string | number>, message: string, suggestions: Array<string> }> };

export async function testValidatorGeneration(schema: any, data: unknown) {
  const code = generateCode(schema);
  const blob = new Blob([code], { type: "application/typescript" });
  const url = URL.createObjectURL(blob);

  // Only that is meant to be exported from the generated module
  const { validate }: { validate: (data: unknown) => ValidationResult } = await import(url);
  const validationResult = validate(data);

  URL.revokeObjectURL(url);
  return validationResult;
}
