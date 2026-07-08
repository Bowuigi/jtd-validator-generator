import { assertEquals } from "@std/assert";
import { testValidatorGeneration } from "./setup.ts";

const FLOAT32_SCHEMA = { elements: { type: "float32" } };

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

Deno.test("elements empty array [] accepted", async () => {
  await assertAccepted(FLOAT32_SCHEMA, []);
});

Deno.test("elements all-valid array [1, 2, 3] accepted", async () => {
  await assertAccepted(FLOAT32_SCHEMA, [1, 2, 3]);
});

Deno.test("elements rejects null (not an array)", async () => {
  await assertRejected(FLOAT32_SCHEMA, null, [
    { path: [], message: "expected array" },
  ]);
});

Deno.test("elements rejects {} (not an array)", async () => {
  await assertRejected(FLOAT32_SCHEMA, {}, [
    { path: [], message: "expected array" },
  ]);
});

Deno.test('elements rejects "foo" (not an array)', async () => {
  await assertRejected(FLOAT32_SCHEMA, "foo", [
    { path: [], message: "expected array" },
  ]);
});

Deno.test("elements single element type mismatch [1, 'foo']", async () => {
  await assertRejected(FLOAT32_SCHEMA, [1, "foo"], [
    { path: [1], message: "expected float32, got string" },
  ]);
});

Deno.test("elements multiple element type mismatches [1, 'a', 'b', 2]", async () => {
  await assertRejected(FLOAT32_SCHEMA, [1, "a", "b", 2], [
    { path: [1], message: "expected float32, got string" },
    { path: [2], message: "expected float32, got string" },
  ]);
});

Deno.test("elements nullable: true accepts null", async () => {
  const result = await testValidatorGeneration(
    { elements: { type: "float32" }, nullable: true },
    null,
  );
  assertEquals(result, { success: true });
});

Deno.test("elements nullable: true valid arrays still work", async () => {
  await assertAccepted(
    { elements: { type: "float32" }, nullable: true },
    [1, 2, 3],
  );
});

Deno.test("elements nullable: true invalid elements still rejected", async () => {
  await assertRejected(
    { elements: { type: "float32" }, nullable: true },
    [1, "foo"],
    [
      { path: [1], message: "expected float32, got string" },
    ],
  );
});
