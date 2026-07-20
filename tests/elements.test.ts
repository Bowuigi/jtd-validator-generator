import { type Schema, testCase } from './setup.ts';

const FLOAT32_SCHEMA: Schema = { elements: { type: 'float32' } };

testCase('elements empty array [] accepted', FLOAT32_SCHEMA, []);
testCase('elements all-valid array [1, 2, 3] accepted', FLOAT32_SCHEMA, [1, 2, 3]);
testCase('elements rejects null (not an array)', FLOAT32_SCHEMA, null, [{
  path: [],
  message: 'expected array, got null',
  suggestions: []
}]);
testCase('elements rejects {} (not an array)', FLOAT32_SCHEMA, {}, [{
  path: [],
  message: 'expected array, got object',
  suggestions: []
}]);
testCase('elements rejects "foo" (not an array)', FLOAT32_SCHEMA, 'foo', [{
  path: [],
  message: 'expected array, got string',
  suggestions: []
}]);
testCase("elements single element type mismatch [1, 'foo']", FLOAT32_SCHEMA, [1, 'foo'], [{
  path: [1],
  message: 'expected float32, got string',
  suggestions: []
}]);
testCase("elements multiple element type mismatches [1, 'a', 'b', 2]", FLOAT32_SCHEMA, [
  1,
  'a',
  'b',
  2
], [
  { path: [1], message: 'expected float32, got string', suggestions: [] },
  { path: [2], message: 'expected float32, got string', suggestions: [] }
]);

const NULLABLE_ELEMS_SCHEMA: Schema = { elements: { type: 'float32' }, nullable: true };

testCase('elements nullable: true accepts null', NULLABLE_ELEMS_SCHEMA, null);
testCase('elements nullable: true valid arrays still work', NULLABLE_ELEMS_SCHEMA, [1, 2, 3]);
testCase('elements nullable: true invalid elements still rejected', NULLABLE_ELEMS_SCHEMA, [
  1,
  'foo'
], [{ path: [1], message: 'expected float32, got string', suggestions: [] }]);

const NULLABLE_INTERIOR_ELEMS_SCHEMA: Schema = { elements: { type: 'float32', nullable: true } };

testCase('elements with a nullable interior rejects null', NULLABLE_INTERIOR_ELEMS_SCHEMA, null, [{
  path: [],
  message: 'expected array, got null',
  suggestions: []
}]);
testCase('elements with a nullable interior accepts valid', NULLABLE_INTERIOR_ELEMS_SCHEMA, [
  1,
  2,
  null,
  3
]);
testCase('elements with a nullable interior rejects all errors', NULLABLE_INTERIOR_ELEMS_SCHEMA, [
  1,
  false,
  null,
  'invalid',
  3
], [
  {
    message: 'expected float32, got boolean',
    path: [1],
    suggestions: []
  },
  {
    message: 'expected float32, got string',
    path: [3],
    suggestions: []
  }
]);
