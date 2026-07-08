# JTD Validator Generator — Test Plan

## Overview

Generate a comprehensive test suite for the JTD validator generator at `tests/`. The generator (`mod.ts`) is currently a stub:

```ts
export function generateCode(schema: any): string {
  return 'export function validate(data: unknown) {return false;}';
}
```

The tests are written **first** (TDD-style) and will fail initially. Once the test suite is complete, the generator will be implemented (not by you, not your job) to make them pass.

### How testing works

`tests/setup.ts` provides `testValidatorGeneration(schema, data)`. You MUST call this function either on the tests themselves or in some helper called from them, because it gives you validator generation (based on `schema`) results when ran using `data` as the data to validate.

Use Deno's testing facilities. `assertEquals` from `@std/assert` and `Deno.test(...)`.

### ValidationResult type (what `testValidatorGeneration` returns)

```ts
type ValidationResult =
  | { success: true }
  | { success: false, errors: Array<{
      path: Array<string | number>,
      message: string,
      suggestions: Array<string>
    }> };
```

### Path convention

- `path` replaces RFC 8927's `instancePath` (JSON Pointer string → array of segments)
- `""` (root) → `[]`
- `"/b"` (property "b") → `["b"]`
- `"/2"` (array index 2) → `[2]`
- `"/a/2/foo"` → `["a", 2, "foo"]`

## Error Message Reference

| Scenario | Message |
|---|---|
| Not an object (properties/values/discriminator) | `"expected object"` |
| Not an array (elements) | `"expected array"` |
| Type mismatch — boolean | `"expected boolean, got <jsonType>"` |
| Type mismatch — string | `"expected string, got <jsonType>"` |
| Type mismatch — float32/float64 | `"expected float32, got <jsonType>"` / `"expected float64, got <jsonType>"` |
| Type mismatch — int8/uint8/int16/uint16/int32/uint32 | `"expected int8, got <jsonType>"` (etc.) |
| Type mismatch — timestamp | `"expected timestamp, got <jsonType>"` |
| Integer fractional | `"expected integer for <jtdType>, got <value>"` |
| Integer out of range | `"value <val> out of range for <jtdType>"` |
| Enum value not in list | `"unexpected \"<value>\""` |
| Missing required property | `"missing required property \"<name>\""` |
| Unexpected property | `"unexpected property \"<name>\""` |
| Missing discriminator tag | `"missing discriminator \"<tag>\""` |
| Discriminator tag not a string | `"discriminator must be a string"` |
| Unknown discriminator value | `"unknown discriminator value \"<value>\""` |

`<jsonType>` is one of: `null`, `boolean`, `number`, `string`, `array`, `object`.

## Suggestion Contents

| Scenario | `suggestions` |
|---|---|
| Enum value not in list | `["value1", "value2", ...]` (all valid enum values) |
| Unknown discriminator value | `["tag1", "tag2", ...]` (all valid mapping keys) |
| Missing discriminator tag | `["tag1", "tag2", ...]` (all valid mapping keys) |
| Unexpected property | `["prop1", "prop2", ...]` (all allowed properties: required + optional) |
| Everything else | `[]` |

## File Structure

```
tests/
├── empty.test.ts         # Empty form
├── type.test.ts          # Type form (all 11 types)
├── enum.test.ts          # Enum form
├── elements.test.ts      # Elements form
├── properties.test.ts    # Properties form
├── values.test.ts        # Values form
├── discriminator.test.ts # Discriminator form
├── ref.test.ts           # Ref form (including recursive)
└── nullable.test.ts      # Nullable cross-cutting behavior
```

---

## Task 1 — `tests/empty.test.ts`

**Overview:** The empty form (`{}` or `{ "nullable": true }` or `{ "metadata": {...} }`) accepts **all** JSON instances. No errors are ever produced.

**TODO:**

- [x] `{}` accepts `null`
- [x] `{}` accepts `true`
- [x] `{}` accepts `false`
- [x] `{}` accepts `123`
- [x] `{}` accepts `"string"`
- [x] `{}` accepts `[]`
- [x] `{}` accepts `{}`
- [x] `{ "nullable": true }` accepts `null`
- [x] `{ "metadata": { "foo": "bar" } }` accepts any value (e.g., `42`)

---

## Task 2 — `tests/type.test.ts`

**Overview:** The type form (`{ "type": "<jtdType>" }`) validates that an instance matches a specific JSON type with optional range constraints.

**Types to test:** `boolean`, `float32`, `float64`, `int8`, `uint8`, `int16`, `uint16`, `int32`, `uint32`, `string`, `timestamp`.

**TODO — boolean tests:**

- [x] `true` accepted
- [x] `false` accepted
- [x] `"true"` rejected — `"expected boolean, got string"`, `path: []`
- [x] `123` rejected — `"expected boolean, got number"`, `path: []`
- [x] `null` rejected — `"expected boolean, got null"`, `path: []`

**TODO — float32/float64 tests:**

- [x] `0` accepted
- [x] `-3.14` accepted
- [x] `1e10` accepted
- [x] `"abc"` rejected — `"expected float32, got string"`, `path: []`
- [x] `null` rejected — `"expected float32, got null"`, `path: []`
- [x] Same tests for `float64` (identical validation behavior)

**TODO — integer type tests (int8, uint8, int16, uint16, int32, uint32):**

Each integer type needs:

- [x] **In-range value accepted** — e.g., `{ "type": "int8" }` accepts `0`, `-128`, `127`
- [x] **In-range with `.0` accepted** — `127.0`, `-128.0`
- [x] **In-range with scientific notation producing integer** — `1.0e1` accepted
- [x] **Above max rejected** — `{ "type": "int8" }` rejects `128` with `"value 128 out of range for int8"`, `path: []`
- [x] **Below min rejected** — `{ "type": "uint8" }` rejects `-1` with `"value -1 out of range for uint8"`, `path: []`
- [x] **Fractional rejected** — `{ "type": "int8" }` rejects `10.5` with `"expected integer for int8, got 10.5"`, `path: []`
- [x] **Wrong JSON type rejected** — `{ "type": "int8" }` rejects `"abc"` with `"expected int8, got string"`, `path: []`
- [x] **null rejected** — `"expected int8, got null"`, `path: []`

Range boundaries:
- `int8`: -128 to 127
- `uint8`: 0 to 255
- `int16`: -32768 to 32767
- `uint16`: 0 to 65535
- `int32`: -2147483648 to 2147483647
- `uint32`: 0 to 4294967295

Each type gets at least: valid boundary values, invalid above/below boundary, fractional rejection, non-number rejection.

**TODO — string tests:**

- [x] `"hello"` accepted
- [x] `""` (empty string) accepted
- [x] `123` rejected — `"expected string, got number"`, `path: []`
- [x] `null` rejected — `"expected string, got null"`, `path: []`

**TODO — timestamp tests:**

- [x] `"1985-04-12T23:20:50.52Z"` accepted
- [x] `"1996-12-19T16:39:57-08:00"` accepted
- [x] `"1996-12-19T16:39:57.123-08:00"` accepted
- [x] `"foo"` rejected — `"expected timestamp, got string"`, `path: []`
- [x] `"2020-01-01"` (no time/timezone) rejected — `"expected timestamp, got string"`, `path: []`
- [x] `123` rejected — `"expected timestamp, got number"`, `path: []`
- [x] `null` rejected — `"expected timestamp, got null"`, `path: []`

---

## Task 3 — `tests/enum.test.ts`

**Overview:** The enum form (`{ "enum": ["A", "B"] }`) validates that a value is one of the listed strings.

**TODO:**

- [x] Each valid value accepted: `{ "enum": ["PENDING", "DONE", "CANCELED"] }` accepts `"PENDING"`, `"DONE"`, `"CANCELED"`
- [x] Unlisted string rejected: `"UNKNOWN"` → `"unexpected \"UNKNOWN\""`, suggestions `["PENDING", "DONE", "CANCELED"]`, `path: []`
- [x] Non-string value rejected: `123` → `"unexpected \"123\""`, suggestions `["PENDING", "DONE", "CANCELED"]`, `path: []`
- [x] `null` rejected — `"unexpected \"null\""`, suggestions `["PENDING", "DONE", "CANCELED"]`, `path: []`
- [x] With `nullable: true`: `null` accepted, `"PENDING"` still accepted, `"UNKNOWN"` still rejected
- [x] Single-value enum: `{ "enum": ["ONLY"] }` accepts `"ONLY"`, rejects `"OTHER"` with suggestions `["ONLY"]`

---

## Task 4 — `tests/elements.test.ts`

**Overview:** The elements form (`{ "elements": { ... } }`) validates that an instance is an array and each element satisfies the subschema.

**TODO:**

- [x] Empty array `[]` accepted
- [x] All-valid array `[1, 2, 3]` accepted for `{ "elements": { "type": "float32" } }`
- [x] Non-array rejected: `null` → `"expected array"`, `path: []`
- [x] Non-array rejected: `{}` → `"expected array"`, `path: []`
- [x] Non-array rejected: `"foo"` → `"expected array"`, `path: []`
- [x] Single element type mismatch: `[1, "foo"]` → error at `path: [1]`, `"expected float32, got string"`
- [x] Multiple element type mismatches: `[1, "a", "b", 2]` → errors at `[1]` and `[2]`
- [x] With `nullable: true`: `null` accepted
- [x] With `nullable: true`: valid arrays still work, invalid elements still rejected

---

## Task 5 — `tests/properties.test.ts`

**Overview:** The properties form (`{ "properties": { ... }, "optionalProperties": { ... } }`) validates JSON objects as structs — required/optional fields, additional properties control.

**TODO — Required properties:**

- [x] All required properties present → accepted
- [x] Missing required property → `"missing required property \"<name>\""`, `path: []`, suggestions `[]`
- [x] Multiple missing required properties → one error per missing property
- [x] Required property type mismatch → error at `path: ["<prop>"]`

**TODO — Optional properties:**

- [x] All optional properties absent → accepted
- [x] Optional property present with valid value → accepted
- [x] Optional property type mismatch → error at `path: ["<prop>"]`

**TODO — Mixed required + optional:**

- [x] RFC example: `{ "properties": { "a": { "type": "string" }, "b": { "type": "string" } }, "optionalProperties": { "c": { "type": "string" }, "d": { "type": "string" } } }`
  - `{ "a": "x", "b": "y" }` accepted
  - `{ "a": "x", "b": "y", "c": "z" }` accepted
  - `{ "a": "x", "b": "y", "c": "z", "d": "w" }` accepted
  - `{ "a": "x", "b": "y", "d": "w" }` accepted

**TODO — Additional properties:**

- [x] Unknown property rejected (default): `{ "e": 3 }` → `"unexpected property \"e\""`, suggestions `["a", "b", "c", "d"]`, `path: ["e"]`
- [x] `additionalProperties: true` — unknown property accepted
- [x] `additionalProperties: true` still validates known properties' values
- [x] Multiple unknown properties → one error per unknown property

**TODO — Not an object:**

- [x] `null` → `"expected object"`, `path: []`
- [x] `"string"` → `"expected object"`, `path: []`
- [x] `123` → `"expected object"`, `path: []`

**TODO — Multiple simultaneous errors (RFC §3.3.6 example):**

- [x] `{ "b": 3, "c": 3, "e": 3 }` against the RFC schema produces 4 errors:
  - `path: []`, `"missing required property \"a\""`, suggestions `[]`
  - `path: ["b"]`, `"expected string, got number"` (from `/properties/b/type`)
  - `path: ["c"]`, `"expected string, got number"` (from `/optionalProperties/c/type`)
  - `path: ["e"]`, `"unexpected property \"e\""`, suggestions `["a", "b", "c", "d"]`
- [x] Same but with `additionalProperties: true` → only 3 errors (no "unexpected property" for `e`)

**TODO — Nullable:**

- [x] `{ "nullable": true, ... }` accepts `null`
- [x] `{ "nullable": true, ... }` still validates non-null objects

**TODO — Edge cases:**

- [x] Only `optionalProperties` (no `properties`) — valid
- [x] Only `properties` (no `optionalProperties`) — valid
- [x] Empty properties object `"properties": {}` — no required properties

---

## Task 6 — `tests/values.test.ts`

**Overview:** The values form (`{ "values": { ... } }`) validates that an instance is an object where all member values satisfy the subschema.

**TODO:**

- [ ] Empty object `{}` accepted
- [ ] All values valid: `{ "a": 1, "b": 2 }` accepted for `{ "values": { "type": "float32" } }`
- [ ] Not an object: `null` → `"expected object"`, `path: []`
- [ ] Not an object: `"foo"` → `"expected object"`, `path: []`
- [ ] Single value type mismatch: `{ "a": 1, "b": "foo" }` → error at `path: ["b"]`
- [ ] Multiple value type mismatches: `{ "a": 1, "b": "foo", "c": "bar" }` → errors at `["b"]`, `["c"]`
- [ ] With `nullable: true`: `null` accepted
- [ ] With `nullable: true`: valid objects still work, invalid values still rejected

---

## Task 7 — `tests/discriminator.test.ts`

**Overview:** The discriminator form (`{ "discriminator": "<prop>", "mapping": { ... } }`) validates tagged unions — objects with a discriminator property whose string value selects a schema variant.

**Schema used:**

```ts
{
  discriminator: "version",
  mapping: {
    v1: { properties: { a: { type: "float32" } } },
    v2: { properties: { a: { type: "string" } } },
  },
}
```

**TODO:**

- [ ] Valid v1: `{ "version": "v1", "a": 1.5 }` accepted
- [ ] Valid v2: `{ "version": "v2", "a": "hello" }` accepted
- [ ] Tag exemption: `"version"` is NOT checked as additional property by the mapping's properties schema
- [ ] Not an object: `null` → `"expected object"`, `path: []`
- [ ] Not an object: `"string"` → `"expected object"`, `path: []`
- [ ] Missing discriminator tag: `{}` → `"missing discriminator \"version\""`, suggestions `["v1", "v2"]`, `path: []`
- [ ] Tag not a string: `{ "version": 1 }` → `"discriminator must be a string"`, suggestions `[]`, `path: ["version"]`
- [ ] Unknown discriminator value: `{ "version": "v3" }` → `"unknown discriminator value \"v3\""`, suggestions `["v1", "v2"]`, `path: ["version"]`
- [ ] Property type mismatch in mapping: `{ "version": "v2", "a": 3 }` → error at `path: ["a"]`, `"expected string, got number"`
- [ ] Extra property on mapping variant: `{ "version": "v1", "a": 1.5, "extra": "x" }` → `"unexpected property \"extra\""`, `path: ["extra"]`
- [ ] With `nullable: true`: `null` accepted
- [ ] More complex mapping with optionalProperties — from RFC §2.2.8 example
- [ ] All mapping variants accepted

---

## Task 8 — `tests/ref.test.ts`

**Overview:** The ref form (`{ "ref": "<name>" }`) delegates validation to a named definition from the root `"definitions"` object. Supports recursive structures.

**TODO — Simple ref:**

```ts
{
  definitions: { a: { type: "float32" } },
  ref: "a",
}
```

- [ ] Value `1.5` accepted
- [ ] Value `"foo"` rejected → `"expected float32, got string"`, `path: []`
- [ ] `null` rejected → `"expected float32, got null"`, `path: []`

**TODO — Nullable ref:**

```ts
{
  definitions: { a: { type: "float32" } },
  ref: "a",
  nullable: true,
}
```

- [ ] `null` accepted
- [ ] `1.5` still accepted
- [ ] `"foo"` still rejected

**TODO — Ref to properties:**

```ts
{
  definitions: {
    coords: {
      properties: {
        lat: { type: "float32" },
        lng: { type: "float32" },
      },
    },
  },
  ref: "coords",
}
```

- [ ] `{ "lat": 1.0, "lng": 2.0 }` accepted
- [ ] `{ "lat": "foo" }` → `"missing required property \"lng\""` at `path: []` AND type error at `path: ["lat"]`

**TODO — Ref in elements:**

```ts
{
  definitions: { a: { type: "float32" } },
  elements: { ref: "a" },
}
```

- [ ] `[1, 2, 3]` accepted
- [ ] `[1, "foo"]` → error at `path: [1]`

**TODO — Ref in properties:**

```ts
{
  definitions: { coordinates: { type: "float32" } },
  properties: {
    x: { ref: "coordinates" },
    y: { ref: "coordinates" },
  },
}
```

- [ ] `{ "x": 1.0, "y": 2.0 }` accepted

**TODO — Recursive schema (linked list):**

```ts
{
  definitions: {
    node: {
      properties: {
        value: { type: "float32" },
        next: { ref: "node", nullable: true },
      },
    },
  },
  ref: "node",
}
```

- [ ] `{ "value": 1, "next": null }` accepted
- [ ] `{ "value": 1, "next": { "value": 2, "next": null } }` accepted
- [ ] `{ "value": 1, "next": { "value": 2, "next": { "value": 3, "next": null } } }` accepted
- [ ] Invalid at depth: `{ "value": 1, "next": { "value": "bad" } }` → error at `path: ["next"]` for missing `"value"` property and type mismatch on `"bad"`

**TODO — Recursive schema (JSON tree):**

```ts
{
  definitions: {
    treeNode: {
      properties: {
        value: { type: "string" },
        children: {
          elements: { ref: "treeNode" },
          nullable: true,
        },
      },
    },
  },
  ref: "treeNode",
}
```

- [ ] Valid tree accepted
- [ ] Invalid at depth rejected

---

## Task 9 — `tests/nullable.test.ts`

**Overview:** Tests that `nullable: true` consistently accepts `null` across all forms, and has no effect when `false` or omitted.

**TODO:**

- [ ] Empty form: `{ "nullable": true }` accepts `null`
- [ ] Type form: `{ "type": "string", "nullable": true }` accepts `null`
- [ ] Enum form: `{ "enum": ["A"], "nullable": true }` accepts `null`
- [ ] Elements form: `{ "elements": { "type": "string" }, "nullable": true }` accepts `null`
- [ ] Properties form: `{ "properties": { "a": { "type": "string" } }, "nullable": true }` accepts `null`
- [ ] Values form: `{ "values": { "type": "string" }, "nullable": true }` accepts `null`
- [ ] Discriminator form: `{ "discriminator": "x", "mapping": { "a": { "properties": { "b": { "type": "string" } } } }, "nullable": true }` accepts `null`
- [ ] `nullable: false` has no effect on any form (null still rejected with form-appropriate message)
- [ ] `nullable` omitted means no null accepted (same as `nullable: false`)
- [ ] `nullable: true` does not leak to child schemas — child schemas without `nullable: true` still reject `null`

---

## Verification

After each test file task is completed:

```bash
deno test tests/<file you worked on.test.ts>
```

All tests should **fail** because `generateCode()` is still a stub returning code that always returns `{ success: false }`. Expected output: each test file shows assertion failures with clear messages about what the generated validator should have done.
