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

// --- boolean ---

Deno.test("type boolean accepts true", async () => {
  await assertAccepted({ type: "boolean" }, true);
});

Deno.test("type boolean accepts false", async () => {
  await assertAccepted({ type: "boolean" }, false);
});

Deno.test('type boolean rejects "true"', async () => {
  await assertRejected({ type: "boolean" }, "true", "expected boolean, got string");
});

Deno.test("type boolean rejects 123", async () => {
  await assertRejected({ type: "boolean" }, 123, "expected boolean, got number");
});

Deno.test("type boolean rejects null", async () => {
  await assertRejected({ type: "boolean" }, null, "expected boolean, got null");
});

// --- float32 ---

Deno.test("type float32 accepts 0", async () => {
  await assertAccepted({ type: "float32" }, 0);
});

Deno.test("type float32 accepts -3.14", async () => {
  await assertAccepted({ type: "float32" }, -3.14);
});

Deno.test("type float32 accepts 1e10", async () => {
  await assertAccepted({ type: "float32" }, 1e10);
});

Deno.test('type float32 rejects "abc"', async () => {
  await assertRejected({ type: "float32" }, "abc", "expected float32, got string");
});

Deno.test("type float32 rejects null", async () => {
  await assertRejected({ type: "float32" }, null, "expected float32, got null");
});

// --- float64 ---

Deno.test("type float64 accepts 0", async () => {
  await assertAccepted({ type: "float64" }, 0);
});

Deno.test("type float64 accepts -3.14", async () => {
  await assertAccepted({ type: "float64" }, -3.14);
});

Deno.test("type float64 accepts 1e10", async () => {
  await assertAccepted({ type: "float64" }, 1e10);
});

Deno.test('type float64 rejects "abc"', async () => {
  await assertRejected({ type: "float64" }, "abc", "expected float64, got string");
});

Deno.test("type float64 rejects null", async () => {
  await assertRejected({ type: "float64" }, null, "expected float64, got null");
});

// --- int8 ---

Deno.test("type int8 accepts 0", async () => {
  await assertAccepted({ type: "int8" }, 0);
});

Deno.test("type int8 accepts -128", async () => {
  await assertAccepted({ type: "int8" }, -128);
});

Deno.test("type int8 accepts 127", async () => {
  await assertAccepted({ type: "int8" }, 127);
});

Deno.test("type int8 accepts 127.0", async () => {
  await assertAccepted({ type: "int8" }, 127.0);
});

Deno.test("type int8 accepts -128.0", async () => {
  await assertAccepted({ type: "int8" }, -128.0);
});

Deno.test("type int8 accepts 1.0e1", async () => {
  await assertAccepted({ type: "int8" }, 1.0e1);
});

Deno.test("type int8 rejects 128 (above max)", async () => {
  await assertRejected({ type: "int8" }, 128, "value 128 out of range for int8");
});

Deno.test("type int8 rejects -129 (below min)", async () => {
  await assertRejected({ type: "int8" }, -129, "value -129 out of range for int8");
});

Deno.test("type int8 rejects 10.5 (fractional)", async () => {
  await assertRejected({ type: "int8" }, 10.5, "expected integer for int8, got 10.5");
});

Deno.test('type int8 rejects "abc" (wrong JSON type)', async () => {
  await assertRejected({ type: "int8" }, "abc", "expected int8, got string");
});

Deno.test("type int8 rejects null", async () => {
  await assertRejected({ type: "int8" }, null, "expected int8, got null");
});

// --- uint8 ---

Deno.test("type uint8 accepts 0", async () => {
  await assertAccepted({ type: "uint8" }, 0);
});

Deno.test("type uint8 accepts 255", async () => {
  await assertAccepted({ type: "uint8" }, 255);
});

Deno.test("type uint8 accepts 255.0", async () => {
  await assertAccepted({ type: "uint8" }, 255.0);
});

Deno.test("type uint8 accepts 1.0e1", async () => {
  await assertAccepted({ type: "uint8" }, 1.0e1);
});

Deno.test("type uint8 rejects 256 (above max)", async () => {
  await assertRejected({ type: "uint8" }, 256, "value 256 out of range for uint8");
});

Deno.test("type uint8 rejects -1 (below min)", async () => {
  await assertRejected({ type: "uint8" }, -1, "value -1 out of range for uint8");
});

Deno.test("type uint8 rejects 10.5 (fractional)", async () => {
  await assertRejected({ type: "uint8" }, 10.5, "expected integer for uint8, got 10.5");
});

Deno.test('type uint8 rejects "abc" (wrong JSON type)', async () => {
  await assertRejected({ type: "uint8" }, "abc", "expected uint8, got string");
});

Deno.test("type uint8 rejects null", async () => {
  await assertRejected({ type: "uint8" }, null, "expected uint8, got null");
});

// --- int16 ---

Deno.test("type int16 accepts 0", async () => {
  await assertAccepted({ type: "int16" }, 0);
});

Deno.test("type int16 accepts -32768", async () => {
  await assertAccepted({ type: "int16" }, -32768);
});

Deno.test("type int16 accepts 32767", async () => {
  await assertAccepted({ type: "int16" }, 32767);
});

Deno.test("type int16 accepts 32767.0", async () => {
  await assertAccepted({ type: "int16" }, 32767.0);
});

Deno.test("type int16 accepts -32768.0", async () => {
  await assertAccepted({ type: "int16" }, -32768.0);
});

Deno.test("type int16 accepts 1.0e1", async () => {
  await assertAccepted({ type: "int16" }, 1.0e1);
});

Deno.test("type int16 rejects 32768 (above max)", async () => {
  await assertRejected({ type: "int16" }, 32768, "value 32768 out of range for int16");
});

Deno.test("type int16 rejects -32769 (below min)", async () => {
  await assertRejected({ type: "int16" }, -32769, "value -32769 out of range for int16");
});

Deno.test("type int16 rejects 10.5 (fractional)", async () => {
  await assertRejected({ type: "int16" }, 10.5, "expected integer for int16, got 10.5");
});

Deno.test('type int16 rejects "abc" (wrong JSON type)', async () => {
  await assertRejected({ type: "int16" }, "abc", "expected int16, got string");
});

Deno.test("type int16 rejects null", async () => {
  await assertRejected({ type: "int16" }, null, "expected int16, got null");
});

// --- uint16 ---

Deno.test("type uint16 accepts 0", async () => {
  await assertAccepted({ type: "uint16" }, 0);
});

Deno.test("type uint16 accepts 65535", async () => {
  await assertAccepted({ type: "uint16" }, 65535);
});

Deno.test("type uint16 accepts 65535.0", async () => {
  await assertAccepted({ type: "uint16" }, 65535.0);
});

Deno.test("type uint16 accepts 1.0e1", async () => {
  await assertAccepted({ type: "uint16" }, 1.0e1);
});

Deno.test("type uint16 rejects 65536 (above max)", async () => {
  await assertRejected({ type: "uint16" }, 65536, "value 65536 out of range for uint16");
});

Deno.test("type uint16 rejects -1 (below min)", async () => {
  await assertRejected({ type: "uint16" }, -1, "value -1 out of range for uint16");
});

Deno.test("type uint16 rejects 10.5 (fractional)", async () => {
  await assertRejected({ type: "uint16" }, 10.5, "expected integer for uint16, got 10.5");
});

Deno.test('type uint16 rejects "abc" (wrong JSON type)', async () => {
  await assertRejected({ type: "uint16" }, "abc", "expected uint16, got string");
});

Deno.test("type uint16 rejects null", async () => {
  await assertRejected({ type: "uint16" }, null, "expected uint16, got null");
});

// --- int32 ---

Deno.test("type int32 accepts 0", async () => {
  await assertAccepted({ type: "int32" }, 0);
});

Deno.test("type int32 accepts -2147483648", async () => {
  await assertAccepted({ type: "int32" }, -2147483648);
});

Deno.test("type int32 accepts 2147483647", async () => {
  await assertAccepted({ type: "int32" }, 2147483647);
});

Deno.test("type int32 accepts 2147483647.0", async () => {
  await assertAccepted({ type: "int32" }, 2147483647.0);
});

Deno.test("type int32 accepts -2147483648.0", async () => {
  await assertAccepted({ type: "int32" }, -2147483648.0);
});

Deno.test("type int32 accepts 1.0e1", async () => {
  await assertAccepted({ type: "int32" }, 1.0e1);
});

Deno.test("type int32 rejects 2147483648 (above max)", async () => {
  await assertRejected({ type: "int32" }, 2147483648, "value 2147483648 out of range for int32");
});

Deno.test("type int32 rejects -2147483649 (below min)", async () => {
  await assertRejected({ type: "int32" }, -2147483649, "value -2147483649 out of range for int32");
});

Deno.test("type int32 rejects 10.5 (fractional)", async () => {
  await assertRejected({ type: "int32" }, 10.5, "expected integer for int32, got 10.5");
});

Deno.test('type int32 rejects "abc" (wrong JSON type)', async () => {
  await assertRejected({ type: "int32" }, "abc", "expected int32, got string");
});

Deno.test("type int32 rejects null", async () => {
  await assertRejected({ type: "int32" }, null, "expected int32, got null");
});

// --- uint32 ---

Deno.test("type uint32 accepts 0", async () => {
  await assertAccepted({ type: "uint32" }, 0);
});

Deno.test("type uint32 accepts 4294967295", async () => {
  await assertAccepted({ type: "uint32" }, 4294967295);
});

Deno.test("type uint32 accepts 4294967295.0", async () => {
  await assertAccepted({ type: "uint32" }, 4294967295.0);
});

Deno.test("type uint32 accepts 1.0e1", async () => {
  await assertAccepted({ type: "uint32" }, 1.0e1);
});

Deno.test("type uint32 rejects 4294967296 (above max)", async () => {
  await assertRejected({ type: "uint32" }, 4294967296, "value 4294967296 out of range for uint32");
});

Deno.test("type uint32 rejects -1 (below min)", async () => {
  await assertRejected({ type: "uint32" }, -1, "value -1 out of range for uint32");
});

Deno.test("type uint32 rejects 10.5 (fractional)", async () => {
  await assertRejected({ type: "uint32" }, 10.5, "expected integer for uint32, got 10.5");
});

Deno.test('type uint32 rejects "abc" (wrong JSON type)', async () => {
  await assertRejected({ type: "uint32" }, "abc", "expected uint32, got string");
});

Deno.test("type uint32 rejects null", async () => {
  await assertRejected({ type: "uint32" }, null, "expected uint32, got null");
});

// --- string ---

Deno.test('type string accepts "hello"', async () => {
  await assertAccepted({ type: "string" }, "hello");
});

Deno.test('type string accepts ""', async () => {
  await assertAccepted({ type: "string" }, "");
});

Deno.test("type string rejects 123", async () => {
  await assertRejected({ type: "string" }, 123, "expected string, got number");
});

Deno.test("type string rejects null", async () => {
  await assertRejected({ type: "string" }, null, "expected string, got null");
});

// --- timestamp ---

Deno.test('type timestamp accepts "1985-04-12T23:20:50.52Z"', async () => {
  await assertAccepted({ type: "timestamp" }, "1985-04-12T23:20:50.52Z");
});

Deno.test('type timestamp accepts "1996-12-19T16:39:57-08:00"', async () => {
  await assertAccepted({ type: "timestamp" }, "1996-12-19T16:39:57-08:00");
});

Deno.test('type timestamp accepts "1996-12-19T16:39:57.123-08:00"', async () => {
  await assertAccepted({ type: "timestamp" }, "1996-12-19T16:39:57.123-08:00");
});

Deno.test('type timestamp rejects "foo"', async () => {
  await assertRejected({ type: "timestamp" }, "foo", "expected timestamp, got string");
});

Deno.test('type timestamp rejects "2020-01-01" (no time)', async () => {
  await assertRejected({ type: "timestamp" }, "2020-01-01", "expected timestamp, got string");
});

Deno.test("type timestamp rejects 123", async () => {
  await assertRejected({ type: "timestamp" }, 123, "expected timestamp, got number");
});

Deno.test("type timestamp rejects null", async () => {
  await assertRejected({ type: "timestamp" }, null, "expected timestamp, got null");
});
