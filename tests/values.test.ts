import type { Schema } from '@/mod.ts';
import { testCase } from './setup.ts';

const FLOAT32_VALUES_SCHEMA: Schema = { values: { type: 'float32' } };

testCase('values empty object {} accepted', FLOAT32_VALUES_SCHEMA, {});
testCase('values all valid { a: 1, b: 2 } accepted', FLOAT32_VALUES_SCHEMA, { a: 1, b: 2 });
testCase('values rejects null (not an object)', FLOAT32_VALUES_SCHEMA, null, [{
  path: [],
  message: 'expected JSON object, got null',
  suggestions: []
}]);
testCase('values rejects "foo" (not an object)', FLOAT32_VALUES_SCHEMA, 'foo', [{
  path: [],
  message: 'expected JSON object, got string',
  suggestions: []
}]);
testCase('values single value type mismatch', FLOAT32_VALUES_SCHEMA, { a: 1, b: 'foo' }, [{
  path: ['b'],
  message: 'expected float32, got string',
  suggestions: []
}]);
testCase('values multiple value type mismatches', FLOAT32_VALUES_SCHEMA, {
  a: 1,
  b: 'foo',
  c: 'bar'
}, [
  { path: ['b'], message: 'expected float32, got string', suggestions: [] },
  { path: ['c'], message: 'expected float32, got string', suggestions: [] }
]);

const NULLABLE_VALUES_SCHEMA: Schema = { values: { type: 'float32' }, nullable: true };

testCase('values nullable: true accepts null', NULLABLE_VALUES_SCHEMA, null);
testCase('values nullable: true valid objects still work', NULLABLE_VALUES_SCHEMA, { a: 1, b: 2 });
testCase('values nullable: true invalid values still rejected', NULLABLE_VALUES_SCHEMA, {
  a: 1,
  b: 'foo'
}, [{ path: ['b'], message: 'expected float32, got string', suggestions: [] }]);

// Nested values
const NESTED_VALUES_SCHEMA: Schema = { values: { values: { type: 'float32' } } };

testCase('values nested values accepted', NESTED_VALUES_SCHEMA, { a: { x: 1 }, b: { y: 2 } });
testCase('values nested values type mismatch at depth', NESTED_VALUES_SCHEMA, { a: { x: 'foo' } }, [
  { path: ['a', 'x'], message: 'expected float32, got string', suggestions: [] }
]);

// Values containing properties
const VALUES_CONTAINING_PROPS: Schema = {
  values: {
    properties: { id: { type: 'float32' }, name: { type: 'string' } }
  }
};

testCase('values containing properties accepted', VALUES_CONTAINING_PROPS, {
  a: { id: 1, name: 'foo' },
  b: { id: 2, name: 'bar' }
});
testCase(
  'values containing properties missing required and type mismatch',
  VALUES_CONTAINING_PROPS,
  { a: { id: 'bad' } },
  [
    { path: ['a', 'id'], message: 'expected float32, got string', suggestions: [] },
    { path: ['a'], message: 'missing required property "name"', suggestions: [] }
  ]
);

// Values containing elements
const VALUES_CONTAINING_ELEMS: Schema = { values: { elements: { type: 'string' } } };

testCase('values containing elements accepted', VALUES_CONTAINING_ELEMS, { a: ['x', 'y'], b: [] });
testCase('values containing elements type mismatch at index', VALUES_CONTAINING_ELEMS, {
  a: ['x', 1]
}, [{ path: ['a', 1], message: 'expected string, got number', suggestions: [] }]);

// Properties containing values
const PROPS_CONTAINING_VALUES: Schema = {
  properties: {
    data: { values: { type: 'float32' } }
  }
};

testCase('properties containing values accepted', PROPS_CONTAINING_VALUES, {
  data: { x: 1, y: 2 }
});
testCase('properties containing values type mismatch', PROPS_CONTAINING_VALUES, {
  data: { x: 'bad' }
}, [{ path: ['data', 'x'], message: 'expected float32, got string', suggestions: [] }]);

// Elements containing values
const ELEMS_CONTAINING_VALUES: Schema = {
  elements: { values: { type: 'float32' } }
};

testCase('elements containing values accepted', ELEMS_CONTAINING_VALUES, [{ a: 1, b: 2 }]);
testCase('elements containing values type mismatch at element value', ELEMS_CONTAINING_VALUES, [{
  a: 'bad'
}], [{ path: [0, 'a'], message: 'expected float32, got string', suggestions: [] }]);
