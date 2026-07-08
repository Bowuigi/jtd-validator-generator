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
