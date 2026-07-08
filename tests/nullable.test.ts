import { assertEquals } from "@std/assert";
import { testValidatorGeneration } from "./setup.ts";

async function assertAccepted(schema: any, data: unknown) {
  const result = await testValidatorGeneration(schema, data);
  assertEquals(result, { success: true });
}

async function assertRejected(
  schema: any,
  data: unknown,
  message: string,
) {
  const result = await testValidatorGeneration(schema, data);
  assertEquals(result.success, false);
  if (result.success) return;
  assertEquals(result.errors, [{
    path: [],
    message,
    suggestions: [],
  }]);
}

// --- Empty form ---

Deno.test("nullable: true on empty form accepts null", async () => {
  await assertAccepted({ nullable: true }, null);
});

// --- Type form ---

Deno.test("nullable: true on type form accepts null", async () => {
  await assertAccepted({ type: "string", nullable: true }, null);
});

// --- Enum form ---

Deno.test("nullable: true on enum form accepts null", async () => {
  await assertAccepted({ enum: ["A"], nullable: true }, null);
});

// --- Elements form ---

Deno.test("nullable: true on elements form accepts null", async () => {
  await assertAccepted(
    { elements: { type: "string" }, nullable: true },
    null,
  );
});

// --- Properties form ---

Deno.test("nullable: true on properties form accepts null", async () => {
  await assertAccepted(
    { properties: { a: { type: "string" } }, nullable: true },
    null,
  );
});

// --- Values form ---

Deno.test("nullable: true on values form accepts null", async () => {
  await assertAccepted(
    { values: { type: "string" }, nullable: true },
    null,
  );
});

// --- Discriminator form ---

Deno.test("nullable: true on discriminator form accepts null", async () => {
  await assertAccepted(
    {
      discriminator: "x",
      mapping: {
        a: { properties: { b: { type: "string" } } },
      },
      nullable: true,
    },
    null,
  );
});

// --- nullable: false has no effect ---

Deno.test("nullable: false on type form still rejects null", async () => {
  await assertRejected(
    { type: "string", nullable: false },
    null,
    "expected string, got null",
  );
});

Deno.test("nullable: false on enum form still rejects null", async () => {
  const result = await testValidatorGeneration(
    { enum: ["A"], nullable: false },
    null,
  );
  assertEquals(result.success, false);
  if (result.success) return;
  assertEquals(result.errors, [{
    path: [],
    message: 'unexpected "null"',
    suggestions: ["A"],
  }]);
});

Deno.test("nullable: false on elements form still rejects null", async () => {
  await assertRejected(
    { elements: { type: "string" }, nullable: false },
    null,
    "expected array",
  );
});

Deno.test("nullable: false on properties form still rejects null", async () => {
  await assertRejected(
    { properties: { a: { type: "string" } }, nullable: false },
    null,
    "expected object",
  );
});

// --- nullable omitted means no null accepted ---

Deno.test("type form without nullable rejects null", async () => {
  await assertRejected(
    { type: "string" },
    null,
    "expected string, got null",
  );
});

Deno.test("enum form without nullable rejects null", async () => {
  const result = await testValidatorGeneration(
    { enum: ["A"] },
    null,
  );
  assertEquals(result.success, false);
  if (result.success) return;
  assertEquals(result.errors, [{
    path: [],
    message: 'unexpected "null"',
    suggestions: ["A"],
  }]);
});

Deno.test("elements form without nullable rejects null", async () => {
  await assertRejected(
    { elements: { type: "string" } },
    null,
    "expected array",
  );
});

Deno.test("properties form without nullable rejects null", async () => {
  await assertRejected(
    { properties: { a: { type: "string" } } },
    null,
    "expected object",
  );
});

Deno.test("values form without nullable rejects null", async () => {
  await assertRejected(
    { values: { type: "string" } },
    null,
    "expected object",
  );
});

Deno.test("discriminator form without nullable rejects null", async () => {
  await assertRejected(
    {
      discriminator: "x",
      mapping: {
        a: { properties: { b: { type: "string" } } },
      },
    },
    null,
    "expected object",
  );
});

// --- nullable: true does not leak to child schemas ---

Deno.test("nullable on parent does not allow null in child properties", async () => {
  const result = await testValidatorGeneration(
    { properties: { a: { type: "string" } }, nullable: true },
    { a: null },
  );
  assertEquals(result.success, false);
  if (result.success) return;
  assertEquals(result.errors, [{
    path: ["a"],
    message: "expected string, got null",
    suggestions: [],
  }]);
});

Deno.test("nullable on parent does not allow null in child elements", async () => {
  const result = await testValidatorGeneration(
    { elements: { type: "string" }, nullable: true },
    [null],
  );
  assertEquals(result.success, false);
  if (result.success) return;
  assertEquals(result.errors, [{
    path: [0],
    message: "expected string, got null",
    suggestions: [],
  }]);
});

Deno.test("nullable on parent does not allow null in child values", async () => {
  const result = await testValidatorGeneration(
    { values: { type: "string" }, nullable: true },
    { key: null },
  );
  assertEquals(result.success, false);
  if (result.success) return;
  assertEquals(result.errors, [{
    path: ["key"],
    message: "expected string, got null",
    suggestions: [],
  }]);
});

Deno.test("nullable on parent does not allow null in nested optionalProperties", async () => {
  const result = await testValidatorGeneration(
    {
      properties: {
        a: { type: "string" },
      },
      optionalProperties: {
        b: { type: "float32" },
      },
      nullable: true,
    },
    { a: "hello", b: null },
  );
  assertEquals(result.success, false);
  if (result.success) return;
  assertEquals(result.errors, [{
    path: ["b"],
    message: "expected float32, got null",
    suggestions: [],
  }]);
});
