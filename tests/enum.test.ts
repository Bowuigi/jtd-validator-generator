import { assertEquals } from "@std/assert";
import { testValidatorGeneration } from "./setup.ts";

async function assertAccepted(schema: any, data: unknown) {
  const result = await testValidatorGeneration(schema, data);
  assertEquals(result, { success: true });
}

async function assertEnumRejected(
  schema: any,
  data: unknown,
  expectedMessage: string,
  expectedSuggestions: Array<string>,
) {
  const result = await testValidatorGeneration(schema, data);
  assertEquals(result.success, false);
  if (result.success) return;
  assertEquals(result.errors, [{
    path: [],
    message: expectedMessage,
    suggestions: expectedSuggestions,
  }]);
}

const STATUS_SCHEMA = { enum: ["PENDING", "DONE", "CANCELED"] };
const STATUSES = ["PENDING", "DONE", "CANCELED"];

Deno.test('enum accepts "PENDING"', async () => {
  await assertAccepted(STATUS_SCHEMA, "PENDING");
});

Deno.test('enum accepts "DONE"', async () => {
  await assertAccepted(STATUS_SCHEMA, "DONE");
});

Deno.test('enum accepts "CANCELED"', async () => {
  await assertAccepted(STATUS_SCHEMA, "CANCELED");
});

Deno.test('enum rejects "UNKNOWN"', async () => {
  await assertEnumRejected(STATUS_SCHEMA, "UNKNOWN", 'unexpected "UNKNOWN"', STATUSES);
});

Deno.test("enum rejects 123", async () => {
  await assertEnumRejected(STATUS_SCHEMA, 123, 'unexpected "123"', STATUSES);
});

Deno.test("enum rejects null", async () => {
  await assertEnumRejected(STATUS_SCHEMA, null, 'unexpected "null"', STATUSES);
});

Deno.test("enum with nullable: true accepts null", async () => {
  const result = await testValidatorGeneration(
    { enum: ["PENDING", "DONE", "CANCELED"], nullable: true },
    null,
  );
  assertEquals(result, { success: true });
});

Deno.test('enum with nullable: true still accepts "PENDING"', async () => {
  await assertAccepted(
    { enum: ["PENDING", "DONE", "CANCELED"], nullable: true },
    "PENDING",
  );
});

Deno.test('enum with nullable: true still rejects "UNKNOWN"', async () => {
  await assertEnumRejected(
    { enum: ["PENDING", "DONE", "CANCELED"], nullable: true },
    "UNKNOWN",
    'unexpected "UNKNOWN"',
    STATUSES,
  );
});

Deno.test('single-value enum accepts "ONLY"', async () => {
  await assertAccepted({ enum: ["ONLY"] }, "ONLY");
});

Deno.test('single-value enum rejects "OTHER"', async () => {
  await assertEnumRejected({ enum: ["ONLY"] }, "OTHER", 'unexpected "OTHER"', ["ONLY"]);
});
