import { assertEquals } from "@std/assert";
import { testValidatorGeneration } from "./setup.ts";

const RFC_SCHEMA = {
  properties: { a: { type: "string" }, b: { type: "string" } },
  optionalProperties: { c: { type: "string" }, d: { type: "string" } },
};

const RFC_ALL_PROPS = ["a", "b", "c", "d"];

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

Deno.test("properties all required present accepted", async () => {
  await assertAccepted(RFC_SCHEMA, { a: "x", b: "y" });
});

Deno.test("properties missing required property", async () => {
  await assertRejected(RFC_SCHEMA, { a: "x" }, [
    { path: [], message: 'missing required property "b"', suggestions: [] },
  ]);
});

Deno.test("properties multiple missing required properties", async () => {
  await assertRejected(RFC_SCHEMA, {}, [
    { path: [], message: 'missing required property "a"', suggestions: [] },
    { path: [], message: 'missing required property "b"', suggestions: [] },
  ]);
});

Deno.test("properties required property type mismatch", async () => {
  await assertRejected(RFC_SCHEMA, { a: 3, b: "y" }, [
    { path: ["a"], message: "expected string, got number" },
  ]);
});

Deno.test("properties all optional absent accepted", async () => {
  await assertAccepted(RFC_SCHEMA, { a: "x", b: "y" });
});

Deno.test("properties optional present valid accepted", async () => {
  await assertAccepted(RFC_SCHEMA, { a: "x", b: "y", c: "z" });
});

Deno.test("properties optional property type mismatch", async () => {
  await assertRejected(RFC_SCHEMA, { a: "x", b: "y", c: 3 }, [
    { path: ["c"], message: "expected string, got number" },
  ]);
});

Deno.test("properties RFC example all combos accepted", async () => {
  await assertAccepted(RFC_SCHEMA, { a: "x", b: "y" });
  await assertAccepted(RFC_SCHEMA, { a: "x", b: "y", c: "z" });
  await assertAccepted(RFC_SCHEMA, { a: "x", b: "y", c: "z", d: "w" });
  await assertAccepted(RFC_SCHEMA, { a: "x", b: "y", d: "w" });
});

Deno.test("properties unknown property rejected", async () => {
  await assertRejected(RFC_SCHEMA, { a: "x", b: "y", e: 3 }, [
    { path: ["e"], message: 'unexpected property "e"', suggestions: RFC_ALL_PROPS },
  ]);
});

Deno.test("properties additionalProperties true accepts unknown", async () => {
  const schema = { ...RFC_SCHEMA, additionalProperties: true };
  await assertAccepted(schema, { a: "x", b: "y", e: 3 });
});

Deno.test("properties additionalProperties true still validates known", async () => {
  const schema = { ...RFC_SCHEMA, additionalProperties: true };
  await assertRejected(schema, { a: 1, b: "y", e: 3 }, [
    { path: ["a"], message: "expected string, got number" },
  ]);
});

Deno.test("properties multiple unknown properties rejected", async () => {
  await assertRejected(RFC_SCHEMA, { a: "x", b: "y", e: 3, f: "z" }, [
    { path: ["e"], message: 'unexpected property "e"', suggestions: RFC_ALL_PROPS },
    { path: ["f"], message: 'unexpected property "f"', suggestions: RFC_ALL_PROPS },
  ]);
});

Deno.test("properties null rejected", async () => {
  await assertRejected(RFC_SCHEMA, null, [
    { path: [], message: "expected object" },
  ]);
});

Deno.test('properties string rejected', async () => {
  await assertRejected(RFC_SCHEMA, "string", [
    { path: [], message: "expected object" },
  ]);
});

Deno.test("properties number rejected", async () => {
  await assertRejected(RFC_SCHEMA, 123, [
    { path: [], message: "expected object" },
  ]);
});

Deno.test("properties RFC 3.3.6 multiple simultaneous errors", async () => {
  await assertRejected(RFC_SCHEMA, { b: 3, c: 3, e: 3 }, [
    { path: [], message: 'missing required property "a"', suggestions: [] },
    { path: ["b"], message: "expected string, got number", suggestions: [] },
    { path: ["c"], message: "expected string, got number", suggestions: [] },
    { path: ["e"], message: 'unexpected property "e"', suggestions: RFC_ALL_PROPS },
  ]);
});

Deno.test("properties RFC 3.3.6 additionalProperties true filters unexpected", async () => {
  const schema = { ...RFC_SCHEMA, additionalProperties: true };
  await assertRejected(schema, { b: 3, c: 3, e: 3 }, [
    { path: [], message: 'missing required property "a"', suggestions: [] },
    { path: ["b"], message: "expected string, got number", suggestions: [] },
    { path: ["c"], message: "expected string, got number", suggestions: [] },
  ]);
});

Deno.test("properties nullable true accepts null", async () => {
  const schema = { ...RFC_SCHEMA, nullable: true };
  const result = await testValidatorGeneration(schema, null);
  assertEquals(result, { success: true });
});

Deno.test("properties nullable true still validates non-null", async () => {
  const schema = { ...RFC_SCHEMA, nullable: true };
  await assertRejected(schema, { a: 1, b: "y" }, [
    { path: ["a"], message: "expected string, got number" },
  ]);
});

Deno.test("properties only optionalProperties valid", async () => {
  const schema = { optionalProperties: { a: { type: "string" } } };
  await assertAccepted(schema, {});
  await assertAccepted(schema, { a: "hello" });
  await assertRejected(schema, { a: 1 }, [
    { path: ["a"], message: "expected string, got number" },
  ]);
});

Deno.test("properties only properties valid", async () => {
  const schema = { properties: { a: { type: "string" } } };
  await assertAccepted(schema, { a: "hello" });
  await assertRejected(schema, {}, [
    { path: [], message: 'missing required property "a"', suggestions: [] },
  ]);
});

Deno.test("properties empty properties object has no required props", async () => {
  const schema = { properties: {} };
  await assertAccepted(schema, {});
  await assertAccepted(schema, { a: 1 });
});

Deno.test("properties array rejected (not object)", async () => {
  await assertRejected(RFC_SCHEMA, [], [
    { path: [], message: "expected object" },
  ]);
});
