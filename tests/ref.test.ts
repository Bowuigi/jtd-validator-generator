import type { Schema } from '@/mod.ts';
import { testCase } from './setup.ts';

// Simple ref
const SIMPLE_REF: Schema = {
  definitions: { a: { type: 'float32' } },
  ref: 'a'
};

testCase('simple ref accepts valid value', SIMPLE_REF, 1.5);
testCase('simple ref rejects type mismatch', SIMPLE_REF, 'foo', [{
  path: [],
  message: 'expected float32, got string',
  suggestions: []
}]);
testCase('simple ref rejects null', SIMPLE_REF, null, [{
  path: [],
  message: 'expected float32, got null',
  suggestions: []
}]);

// Nullable ref
const NULLABLE_REF: Schema = {
  definitions: { a: { type: 'float32' } },
  ref: 'a',
  nullable: true
};

testCase('nullable ref accepts null', NULLABLE_REF, null);
testCase('nullable ref still accepts valid value', NULLABLE_REF, 1.5);
testCase('nullable ref still rejects type mismatch', NULLABLE_REF, 'foo', [{
  path: [],
  message: 'expected float32, got string',
  suggestions: []
}]);

// Ref to properties
const REF_TO_PROPERTIES: Schema = {
  definitions: {
    coords: {
      properties: {
        lat: { type: 'float32' },
        lng: { type: 'float32' }
      }
    }
  },
  ref: 'coords'
};

testCase('ref to properties accepts valid object', REF_TO_PROPERTIES, { lat: 1.0, lng: 2.0 });
testCase('ref to properties rejects with missing property and type error', REF_TO_PROPERTIES, {
  lat: 'foo'
}, [
  { path: ['lat'], message: 'expected float32, got string', suggestions: [] },
  { path: [], message: 'missing required property "lng"', suggestions: [] }
]);

// Ref in elements
const REF_IN_ELEMENTS: Schema = {
  definitions: { a: { type: 'float32' } },
  elements: { ref: 'a' }
};

testCase('ref in elements accepts all-valid array', REF_IN_ELEMENTS, [1, 2, 3]);
testCase('ref in elements rejects with error at index', REF_IN_ELEMENTS, [1, 'foo'], [{
  path: [1],
  message: 'expected float32, got string',
  suggestions: []
}]);

// Ref in properties
const REF_IN_PROPERTIES: Schema = {
  definitions: { coordinates: { type: 'float32' } },
  properties: {
    x: { ref: 'coordinates' },
    y: { ref: 'coordinates' }
  }
};

testCase('ref in properties accepts valid object', REF_IN_PROPERTIES, { x: 1.0, y: 2.0 });

// Recursive linked list
const RECURSIVE_LIST: Schema = {
  definitions: {
    node: {
      properties: {
        value: { type: 'float32' },
        next: { ref: 'node', nullable: true }
      }
    }
  },
  ref: 'node'
};

testCase('recursive list accepts single node with null next', RECURSIVE_LIST, {
  value: 1,
  next: null
});
testCase('recursive list accepts two nodes', RECURSIVE_LIST, {
  value: 1,
  next: { value: 2, next: null }
});
testCase('recursive list accepts three nodes', RECURSIVE_LIST, {
  value: 1,
  next: { value: 2, next: { value: 3, next: null } }
});
testCase('recursive list rejects invalid at depth', RECURSIVE_LIST, {
  value: 1,
  next: { value: 'bad' }
}, [
  { path: ['next', 'value'], message: 'expected float32, got string', suggestions: [] },
  { path: ['next'], message: 'missing required property "next"', suggestions: [] }
]);

// Recursive JSON tree
const RECURSIVE_TREE: Schema = {
  definitions: {
    treeNode: {
      properties: {
        value: { type: 'string' },
        children: {
          elements: { ref: 'treeNode' },
          nullable: true
        }
      }
    }
  },
  ref: 'treeNode'
};

testCase('recursive tree accepts valid tree', RECURSIVE_TREE, {
  value: 'root',
  children: [
    { value: 'child1', children: null },
    { value: 'child2', children: [{ value: 'grandchild', children: null }] }
  ]
});

testCase('recursive tree rejects invalid at depth', RECURSIVE_TREE, {
  value: 'root',
  children: [
    { value: 123, children: null }
  ]
}, [
  { path: ['children', 0, 'value'], message: 'expected string, got number', suggestions: [] }
]);
