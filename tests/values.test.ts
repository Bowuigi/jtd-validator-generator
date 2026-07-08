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

// Nested values

const NESTED_VALUES_SCHEMA = { values: { values: { type: "float32" } } };

Deno.test("values nested values accepted", async () => {
  await assertAccepted(NESTED_VALUES_SCHEMA, { a: { x: 1 }, b: { y: 2 } });
});

Deno.test("values nested values type mismatch at depth", async () => {
  await assertRejected(NESTED_VALUES_SCHEMA, { a: { x: "foo" } }, [
    { path: ["a", "x"], message: "expected float32, got string" },
  ]);
});

// Values containing properties

const VALUES_CONTAINING_PROPS = {
  values: {
    properties: { id: { type: "float32" }, name: { type: "string" } },
  },
};

Deno.test("values containing properties accepted", async () => {
  await assertAccepted(
    VALUES_CONTAINING_PROPS,
    { a: { id: 1, name: "foo" }, b: { id: 2, name: "bar" } },
  );
});

Deno.test("values containing properties missing required and type mismatch", async () => {
  await assertRejected(VALUES_CONTAINING_PROPS, { a: { id: "bad" } }, [
    { path: ["a"], message: 'missing required property "name"', suggestions: [] },
    { path: ["a", "id"], message: "expected float32, got string" },
  ]);
});

// Values containing elements

const VALUES_CONTAINING_ELEMS = { values: { elements: { type: "string" } } };

Deno.test("values containing elements accepted", async () => {
  await assertAccepted(
    VALUES_CONTAINING_ELEMS,
    { a: ["x", "y"], b: [] },
  );
});

Deno.test("values containing elements type mismatch at index", async () => {
  await assertRejected(VALUES_CONTAINING_ELEMS, { a: ["x", 1] }, [
    { path: ["a", 1], message: "expected string, got number" },
  ]);
});

// Properties containing values

const PROPS_CONTAINING_VALUES = {
  properties: {
    data: { values: { type: "float32" } },
  },
};

Deno.test("properties containing values accepted", async () => {
  await assertAccepted(
    PROPS_CONTAINING_VALUES,
    { data: { x: 1, y: 2 } },
  );
});

Deno.test("properties containing values type mismatch", async () => {
  await assertRejected(PROPS_CONTAINING_VALUES, { data: { x: "bad" } }, [
    { path: ["data", "x"], message: "expected float32, got string" },
  ]);
});

// Elements containing values

const ELEMS_CONTAINING_VALUES = {
  elements: { values: { type: "float32" } },
};

Deno.test("elements containing values accepted", async () => {
  await assertAccepted(
    ELEMS_CONTAINING_VALUES,
    [{ a: 1, b: 2 }],
  );
});

Deno.test("elements containing values type mismatch at element value", async () => {
  await assertRejected(ELEMS_CONTAINING_VALUES, [{ a: "bad" }], [
    { path: [0, "a"], message: "expected float32, got string" },
  ]);
});
