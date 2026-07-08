import { assertEquals } from "@std/assert";
import { testValidatorGeneration } from "./setup.ts";

Deno.test("empty {} accepts null", async () => {
  const result = await testValidatorGeneration({}, null);
  assertEquals(result, { success: true });
});

Deno.test("empty {} accepts true", async () => {
  const result = await testValidatorGeneration({}, true);
  assertEquals(result, { success: true });
});

Deno.test("empty {} accepts false", async () => {
  const result = await testValidatorGeneration({}, false);
  assertEquals(result, { success: true });
});

Deno.test("empty {} accepts 123", async () => {
  const result = await testValidatorGeneration({}, 123);
  assertEquals(result, { success: true });
});

Deno.test('empty {} accepts "string"', async () => {
  const result = await testValidatorGeneration({}, "string");
  assertEquals(result, { success: true });
});

Deno.test("empty {} accepts []", async () => {
  const result = await testValidatorGeneration({}, []);
  assertEquals(result, { success: true });
});

Deno.test("empty {} accepts {}", async () => {
  const result = await testValidatorGeneration({}, {});
  assertEquals(result, { success: true });
});

Deno.test('{ nullable: true } accepts null', async () => {
  const result = await testValidatorGeneration({ nullable: true }, null);
  assertEquals(result, { success: true });
});

Deno.test('{ metadata: { foo: "bar" } } accepts any value', async () => {
  const result = await testValidatorGeneration({ metadata: { foo: "bar" } }, 42);
  assertEquals(result, { success: true });
});
