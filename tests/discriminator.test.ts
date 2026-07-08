import { assertEquals } from "@std/assert";
import { testValidatorGeneration } from "./setup.ts";

const DISCRIMINATOR_SCHEMA = {
  discriminator: "version",
  mapping: {
    v1: { properties: { a: { type: "float32" } } },
    v2: { properties: { a: { type: "string" } } },
  },
};

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

Deno.test("discriminator valid v1 accepted", async () => {
  await assertAccepted(DISCRIMINATOR_SCHEMA, { version: "v1", a: 1.5 });
});

Deno.test("discriminator valid v2 accepted", async () => {
  await assertAccepted(DISCRIMINATOR_SCHEMA, { version: "v2", a: "hello" });
});

Deno.test("discriminator tag exemption — discriminator key not flagged as extra", async () => {
  await assertAccepted(DISCRIMINATOR_SCHEMA, { version: "v1", a: 1.5 });
});

Deno.test("discriminator null rejected (not an object)", async () => {
  await assertRejected(DISCRIMINATOR_SCHEMA, null, [
    { path: [], message: "expected object" },
  ]);
});

Deno.test('discriminator string rejected (not an object)', async () => {
  await assertRejected(DISCRIMINATOR_SCHEMA, "string", [
    { path: [], message: "expected object" },
  ]);
});

Deno.test("discriminator missing discriminator tag", async () => {
  await assertRejected(DISCRIMINATOR_SCHEMA, {}, [
    { path: [], message: 'missing discriminator "version"', suggestions: ["v1", "v2"] },
  ]);
});

Deno.test("discriminator tag not a string", async () => {
  await assertRejected(DISCRIMINATOR_SCHEMA, { version: 1 }, [
    { path: ["version"], message: "discriminator must be a string", suggestions: [] },
  ]);
});

Deno.test("discriminator unknown discriminator value", async () => {
  await assertRejected(DISCRIMINATOR_SCHEMA, { version: "v3" }, [
    { path: ["version"], message: 'unknown discriminator value "v3"', suggestions: ["v1", "v2"] },
  ]);
});

Deno.test("discriminator property type mismatch in mapping", async () => {
  await assertRejected(DISCRIMINATOR_SCHEMA, { version: "v2", a: 3 }, [
    { path: ["a"], message: "expected string, got number" },
  ]);
});

Deno.test("discriminator extra property on mapping variant", async () => {
  await assertRejected(DISCRIMINATOR_SCHEMA, { version: "v1", a: 1.5, extra: "x" }, [
    { path: ["extra"], message: 'unexpected property "extra"' },
  ]);
});

Deno.test("discriminator nullable: true accepts null", async () => {
  const result = await testValidatorGeneration(
    { ...DISCRIMINATOR_SCHEMA, nullable: true },
    null,
  );
  assertEquals(result, { success: true });
});

Deno.test("discriminator nullable: true non-null still validated", async () => {
  await assertRejected(
    { ...DISCRIMINATOR_SCHEMA, nullable: true },
    { version: "v2", a: 3 },
    [
      { path: ["a"], message: "expected string, got number" },
    ],
  );
});

const COMPLEX_DISCRIMINATOR_SCHEMA = {
  discriminator: "event_type",
  mapping: {
    account_deleted: {
      properties: { account_id: { type: "string" } },
    },
    account_payment_plan_changed: {
      properties: {
        account_id: { type: "string" },
        payment_plan: { enum: ["FREE", "PAID"] },
      },
      optionalProperties: {
        upgraded_by: { type: "string" },
      },
    },
  },
};

Deno.test("discriminator complex mapping variant account_deleted accepted", async () => {
  await assertAccepted(
    COMPLEX_DISCRIMINATOR_SCHEMA,
    { event_type: "account_deleted", account_id: "abc-123" },
  );
});

Deno.test("discriminator complex mapping variant account_payment_plan_changed accepted", async () => {
  await assertAccepted(
    COMPLEX_DISCRIMINATOR_SCHEMA,
    { event_type: "account_payment_plan_changed", account_id: "abc-123", payment_plan: "PAID" },
  );
});

Deno.test("discriminator complex mapping with optional property accepted", async () => {
  await assertAccepted(
    COMPLEX_DISCRIMINATOR_SCHEMA,
    { event_type: "account_payment_plan_changed", account_id: "abc-123", payment_plan: "PAID", upgraded_by: "users/mkhwarizmi" },
  );
});

Deno.test("discriminator complex mapping extra property rejected", async () => {
  await assertRejected(
    COMPLEX_DISCRIMINATOR_SCHEMA,
    { event_type: "account_payment_plan_changed", account_id: "abc-123", payment_plan: "PAID", xxx: "asdf" },
    [
      { path: ["xxx"], message: 'unexpected property "xxx"' },
    ],
  );
});

Deno.test("discriminator complex mapping missing required property", async () => {
  await assertRejected(
    COMPLEX_DISCRIMINATOR_SCHEMA,
    { event_type: "account_deleted" },
    [
      { path: [], message: 'missing required property "account_id"', suggestions: [] },
    ],
  );
});

// Nested discriminators

const PROPS_CONTAINING_DISCRIMINATOR = {
  properties: {
    data: {
      discriminator: "type",
      mapping: {
        foo: { properties: { x: { type: "float32" } } },
        bar: { properties: { y: { type: "string" } } },
      },
    },
  },
};

Deno.test("discriminator nested inside properties — valid foo accepted", async () => {
  await assertAccepted(
    PROPS_CONTAINING_DISCRIMINATOR,
    { data: { type: "foo", x: 1.5 } },
  );
});

Deno.test("discriminator nested inside properties — valid bar accepted", async () => {
  await assertAccepted(
    PROPS_CONTAINING_DISCRIMINATOR,
    { data: { type: "bar", y: "hello" } },
  );
});

Deno.test("discriminator nested inside properties — unknown discriminator value at depth", async () => {
  await assertRejected(
    PROPS_CONTAINING_DISCRIMINATOR,
    { data: { type: "baz" } },
    [
      { path: ["data", "type"], message: 'unknown discriminator value "baz"', suggestions: ["foo", "bar"] },
    ],
  );
});

Deno.test("discriminator nested inside properties — type mismatch at depth", async () => {
  await assertRejected(
    PROPS_CONTAINING_DISCRIMINATOR,
    { data: { type: "foo", x: "bad" } },
    [
      { path: ["data", "x"], message: "expected float32, got string" },
    ],
  );
});

Deno.test("discriminator nested inside properties — extra property on variant at depth", async () => {
  await assertRejected(
    PROPS_CONTAINING_DISCRIMINATOR,
    { data: { type: "foo", x: 1.5, extra: "x" } },
    [
      { path: ["data", "extra"], message: 'unexpected property "extra"' },
    ],
  );
});

const VALUES_CONTAINING_DISCRIMINATOR = {
  values: {
    discriminator: "kind",
    mapping: {
      a: { properties: { val: { type: "float32" } } },
      b: { properties: { val: { type: "string" } } },
    },
  },
};

Deno.test("discriminator nested inside values — all valid accepted", async () => {
  await assertAccepted(
    VALUES_CONTAINING_DISCRIMINATOR,
    { key1: { kind: "a", val: 1.5 }, key2: { kind: "b", val: "hello" } },
  );
});

Deno.test("discriminator nested inside values — type mismatch at depth", async () => {
  await assertRejected(
    VALUES_CONTAINING_DISCRIMINATOR,
    { key: { kind: "a", val: "bad" } },
    [
      { path: ["key", "val"], message: "expected float32, got string" },
    ],
  );
});

Deno.test("discriminator nested inside values — unknown discriminator value at depth", async () => {
  await assertRejected(
    VALUES_CONTAINING_DISCRIMINATOR,
    { key: { kind: "c" } },
    [
      { path: ["key", "kind"], message: 'unknown discriminator value "c"', suggestions: ["a", "b"] },
    ],
  );
});

const ELEMS_CONTAINING_DISCRIMINATOR = {
  elements: {
    discriminator: "type",
    mapping: {
      foo: { properties: { id: { type: "float32" } } },
      bar: { properties: { id: { type: "string" } } },
    },
  },
};

Deno.test("discriminator nested inside elements — all valid accepted", async () => {
  await assertAccepted(
    ELEMS_CONTAINING_DISCRIMINATOR,
    [{ type: "foo", id: 1 }, { type: "bar", id: "x" }],
  );
});

Deno.test("discriminator nested inside elements — type mismatch at index", async () => {
  await assertRejected(
    ELEMS_CONTAINING_DISCRIMINATOR,
    [{ type: "foo", id: "bad" }],
    [
      { path: [0, "id"], message: "expected float32, got string" },
    ],
  );
});

const DISCRIMINATOR_CONTAINING_ELEMS = {
  discriminator: "type",
  mapping: {
    withArray: {
      properties: {
        items: { elements: { type: "string" } },
      },
    },
  },
};

Deno.test("discriminator containing elements — valid accepted", async () => {
  await assertAccepted(
    DISCRIMINATOR_CONTAINING_ELEMS,
    { type: "withArray", items: ["a", "b"] },
  );
});

Deno.test("discriminator containing elements — error at array index under property", async () => {
  await assertRejected(
    DISCRIMINATOR_CONTAINING_ELEMS,
    { type: "withArray", items: [1] },
    [
      { path: ["items", 0], message: "expected string, got number" },
    ],
  );
});

const DISCRIMINATOR_CONTAINING_VALUES = {
  discriminator: "type",
  mapping: {
    withDict: {
      properties: {
        dict: { values: { type: "float32" } },
      },
    },
  },
};

Deno.test("discriminator containing values — valid accepted", async () => {
  await assertAccepted(
    DISCRIMINATOR_CONTAINING_VALUES,
    { type: "withDict", dict: { x: 1, y: 2 } },
  );
});

Deno.test("discriminator containing values — error at map key under property", async () => {
  await assertRejected(
    DISCRIMINATOR_CONTAINING_VALUES,
    { type: "withDict", dict: { x: "bad" } },
    [
      { path: ["dict", "x"], message: "expected float32, got string" },
    ],
  );
});

const NESTED_DISCRIMINATOR = {
  discriminator: "outer",
  mapping: {
    inner: {
      properties: {
        payload: {
          discriminator: "innerType",
          mapping: {
            a: { properties: { val: { type: "float32" } } },
            b: { properties: { val: { type: "string" } } },
          },
        },
      },
    },
  },
};

Deno.test("nested discriminator — valid inner a accepted", async () => {
  await assertAccepted(
    NESTED_DISCRIMINATOR,
    { outer: "inner", payload: { innerType: "a", val: 1.5 } },
  );
});

Deno.test("nested discriminator — valid inner b accepted", async () => {
  await assertAccepted(
    NESTED_DISCRIMINATOR,
    { outer: "inner", payload: { innerType: "b", val: "hello" } },
  );
});

Deno.test("nested discriminator — error at depth in inner discriminator", async () => {
  await assertRejected(
    NESTED_DISCRIMINATOR,
    { outer: "inner", payload: { innerType: "a", val: "bad" } },
    [
      { path: ["payload", "val"], message: "expected float32, got string" },
    ],
  );
});

Deno.test("nested discriminator with nullable outer — null accepted", async () => {
  const result = await testValidatorGeneration(
    { ...NESTED_DISCRIMINATOR, nullable: true },
    null,
  );
  assertEquals(result, { success: true });
});

Deno.test("nested discriminator with nullable outer — inner errors still reported", async () => {
  await assertRejected(
    { ...NESTED_DISCRIMINATOR, nullable: true },
    { outer: "inner", payload: { innerType: "a", val: "bad" } },
    [
      { path: ["payload", "val"], message: "expected float32, got string" },
    ],
  );
});
