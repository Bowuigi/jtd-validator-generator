import { assertEquals } from "@std/assert";
import { testValidatorGeneration } from "./setup.ts";

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

// Simple ref

const SIMPLE_REF = {
  definitions: { a: { type: "float32" } },
  ref: "a",
};

Deno.test("simple ref accepts valid value", async () => {
  await assertAccepted(SIMPLE_REF, 1.5);
});

Deno.test("simple ref rejects type mismatch", async () => {
  await assertRejected(SIMPLE_REF, "foo", [
    { path: [], message: "expected float32, got string" },
  ]);
});

Deno.test("simple ref rejects null", async () => {
  await assertRejected(SIMPLE_REF, null, [
    { path: [], message: "expected float32, got null" },
  ]);
});

// Nullable ref

const NULLABLE_REF = {
  definitions: { a: { type: "float32" } },
  ref: "a",
  nullable: true,
};

Deno.test("nullable ref accepts null", async () => {
  await assertAccepted(NULLABLE_REF, null);
});

Deno.test("nullable ref still accepts valid value", async () => {
  await assertAccepted(NULLABLE_REF, 1.5);
});

Deno.test("nullable ref still rejects type mismatch", async () => {
  await assertRejected(NULLABLE_REF, "foo", [
    { path: [], message: "expected float32, got string" },
  ]);
});

// Ref to properties

const REF_TO_PROPERTIES = {
  definitions: {
    coords: {
      properties: {
        lat: { type: "float32" },
        lng: { type: "float32" },
      },
    },
  },
  ref: "coords",
};

Deno.test("ref to properties accepts valid object", async () => {
  await assertAccepted(REF_TO_PROPERTIES, { lat: 1.0, lng: 2.0 });
});

Deno.test("ref to properties rejects with missing property and type error", async () => {
  await assertRejected(REF_TO_PROPERTIES, { lat: "foo" }, [
    { path: [], message: 'missing required property "lng"', suggestions: [] },
    { path: ["lat"], message: "expected float32, got string" },
  ]);
});

// Ref in elements

const REF_IN_ELEMENTS = {
  definitions: { a: { type: "float32" } },
  elements: { ref: "a" },
};

Deno.test("ref in elements accepts all-valid array", async () => {
  await assertAccepted(REF_IN_ELEMENTS, [1, 2, 3]);
});

Deno.test("ref in elements rejects with error at index", async () => {
  await assertRejected(REF_IN_ELEMENTS, [1, "foo"], [
    { path: [1], message: "expected float32, got string" },
  ]);
});

// Ref in properties

const REF_IN_PROPERTIES = {
  definitions: { coordinates: { type: "float32" } },
  properties: {
    x: { ref: "coordinates" },
    y: { ref: "coordinates" },
  },
};

Deno.test("ref in properties accepts valid object", async () => {
  await assertAccepted(REF_IN_PROPERTIES, { x: 1.0, y: 2.0 });
});

// Recursive linked list

const RECURSIVE_LIST = {
  definitions: {
    node: {
      properties: {
        value: { type: "float32" },
        next: { ref: "node", nullable: true },
      },
    },
  },
  ref: "node",
};

Deno.test("recursive list accepts single node with null next", async () => {
  await assertAccepted(RECURSIVE_LIST, { value: 1, next: null });
});

Deno.test("recursive list accepts two nodes", async () => {
  await assertAccepted(RECURSIVE_LIST, {
    value: 1,
    next: { value: 2, next: null },
  });
});

Deno.test("recursive list accepts three nodes", async () => {
  await assertAccepted(RECURSIVE_LIST, {
    value: 1,
    next: { value: 2, next: { value: 3, next: null } },
  });
});

Deno.test("recursive list rejects invalid at depth", async () => {
  await assertRejected(RECURSIVE_LIST, {
    value: 1,
    next: { value: "bad" },
  }, [
    { path: ["next", "value"], message: "expected float32, got string" },
    { path: ["next"], message: 'missing required property "next"', suggestions: [] },
  ]);
});

// Recursive JSON tree

const RECURSIVE_TREE = {
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
};

Deno.test("recursive tree accepts valid tree", async () => {
  await assertAccepted(RECURSIVE_TREE, {
    value: "root",
    children: [
      { value: "child1", children: null },
      { value: "child2", children: [{ value: "grandchild", children: null }] },
    ],
  });
});

Deno.test("recursive tree rejects invalid at depth", async () => {
  await assertRejected(RECURSIVE_TREE, {
    value: "root",
    children: [
      { value: 123, children: null },
    ],
  }, [
    { path: ["children", 0, "value"], message: "expected string, got number" },
  ]);
});
