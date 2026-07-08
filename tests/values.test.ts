import { assertEquals } from "@std/assert";
import { testValidatorGeneration } from "./setup.ts";

const FLOAT32_VALUES_SCHEMA = { values: { type: "float32" } };

async function assertAccepted(schema: any, data: unknown) {
  const result = await testValidatorGeneration(schema, data);
  assertEquals(result, { success: true });
}

async function assertRejected(
  schema: any,
  data: unknown,
  expectedErrors: Array<{ path: Array<string | number>; message: string; suggestions?: Array<string> }>,
) {
  const result = await testValidatorGeneration(schema, data);
  assertEquals(result.success, false);
  if (result.success) return;
  const normalized = result.errors.map((e) => ({
    ...e,
    suggestions: e.suggestions ?? [],
  }));
  const expected = expectedErrors.map((e) => ({
    path: e.path,
    message: e.message,
    suggestions: e.suggestions ?? [],
  }));
  assertEquals(normalized, expected);
}

Deno.test("values empty object {} accepted", async () => {
  await assertAccepted(FLOAT32_VALUES_SCHEMA, {});
});

Deno.test("values all valid { a: 1, b: 2 } accepted", async () => {
  await assertAccepted(FLOAT32_VALUES_SCHEMA, { a: 1, b: 2 });
});

Deno.test("values rejects null (not an object)", async () => {
  await assertRejected(FLOAT32_VALUES_SCHEMA, null, [
    { path: [], message: "expected object" },
  ]);
});

Deno.test('values rejects "foo" (not an object)', async () => {
  await assertRejected(FLOAT32_VALUES_SCHEMA, "foo", [
    { path: [], message: "expected object" },
  ]);
});

Deno.test("values single value type mismatch", async () => {
  await assertRejected(FLOAT32_VALUES_SCHEMA, { a: 1, b: "foo" }, [
    { path: ["b"], message: "expected float32, got string" },
  ]);
});

Deno.test("values multiple value type mismatches", async () => {
  await assertRejected(FLOAT32_VALUES_SCHEMA, { a: 1, b: "foo", c: "bar" }, [
    { path: ["b"], message: "expected float32, got string" },
    { path: ["c"], message: "expected float32, got string" },
  ]);
});

Deno.test("values nullable: true accepts null", async () => {
  const result = await testValidatorGeneration(
    { values: { type: "float32" }, nullable: true },
    null,
  );
  assertEquals(result, { success: true });
});

Deno.test("values nullable: true valid objects still work", async () => {
  await assertAccepted(
    { values: { type: "float32" }, nullable: true },
    { a: 1, b: 2 },
  );
});

Deno.test("values nullable: true invalid values still rejected", async () => {
  await assertRejected(
    { values: { type: "float32" }, nullable: true },
    { a: 1, b: "foo" },
    [
      { path: ["b"], message: "expected float32, got string" },
    ],
  );
});
