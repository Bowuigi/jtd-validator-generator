import { type Schema, testCase } from './setup.ts';

const RFC_SCHEMA: Schema = {
  properties: { a: { type: 'string' }, b: { type: 'string' } },
  optionalProperties: { c: { type: 'string' }, d: { type: 'string' } }
};

const RFC_ALL_PROPS = ['a', 'b', 'c', 'd'];

// Required properties
testCase('properties all required present accepted', RFC_SCHEMA, { a: 'x', b: 'y' });
testCase('properties missing required property', RFC_SCHEMA, { a: 'x' }, [{
  path: [],
  message: 'missing required property "b"',
  suggestions: []
}]);
testCase('properties multiple missing required properties', RFC_SCHEMA, {}, [
  { path: [], message: 'missing required property "a"', suggestions: [] },
  { path: [], message: 'missing required property "b"', suggestions: [] }
]);
testCase('properties required property type mismatch', RFC_SCHEMA, { a: 3, b: 'y' }, [{
  path: ['a'],
  message: 'expected string, got number',
  suggestions: []
}]);

// Optional properties
testCase('properties all optional absent accepted', RFC_SCHEMA, { a: 'x', b: 'y' });
testCase('properties optional present valid accepted', RFC_SCHEMA, { a: 'x', b: 'y', c: 'z' });
testCase('properties optional property type mismatch', RFC_SCHEMA, { a: 'x', b: 'y', c: 3 }, [{
  path: ['c'],
  message: 'expected string, got number',
  suggestions: []
}]);

// RFC example combos
testCase('properties RFC example accepts {a, b}', RFC_SCHEMA, { a: 'x', b: 'y' });
testCase('properties RFC example accepts {a, b, c}', RFC_SCHEMA, { a: 'x', b: 'y', c: 'z' });
testCase('properties RFC example accepts {a, b, c, d}', RFC_SCHEMA, {
  a: 'x',
  b: 'y',
  c: 'z',
  d: 'w'
});
testCase('properties RFC example accepts {a, b, d}', RFC_SCHEMA, { a: 'x', b: 'y', d: 'w' });

// Additional properties
testCase('properties unknown property rejected', RFC_SCHEMA, { a: 'x', b: 'y', e: 3 }, [{
  path: [],
  message: 'unexpected properties: "e"',
  suggestions: RFC_ALL_PROPS
}]);

const RFC_ADDITIONAL: Schema = { ...RFC_SCHEMA, additionalProperties: true };

testCase('properties additionalProperties true accepts unknown', RFC_ADDITIONAL, {
  a: 'x',
  b: 'y',
  e: 3
});
testCase('properties additionalProperties true still validates known', RFC_ADDITIONAL, {
  a: 1,
  b: 'y',
  e: 3
}, [{ path: ['a'], message: 'expected string, got number', suggestions: [] }]);
testCase('properties multiple unknown properties rejected', RFC_SCHEMA, {
  a: 'x',
  b: 'y',
  e: 3,
  f: 'z'
}, [
  { path: [], message: 'unexpected properties: "e", "f"', suggestions: RFC_ALL_PROPS }
]);

// Not an object
testCase('properties null rejected', RFC_SCHEMA, null, [{
  path: [],
  message: 'expected JSON object, got null',
  suggestions: []
}]);
testCase('properties string rejected', RFC_SCHEMA, 'string', [{
  path: [],
  message: 'expected JSON object, got string',
  suggestions: []
}]);
testCase('properties number rejected', RFC_SCHEMA, 123, [{
  path: [],
  message: 'expected JSON object, got number',
  suggestions: []
}]);

// Multiple simultaneous errors
testCase('properties RFC 3.3.6 multiple simultaneous errors', RFC_SCHEMA, { b: 3, c: 3, e: 3 }, [
  { path: [], message: 'missing required property "a"', suggestions: [] },
  { path: ['b'], message: 'expected string, got number', suggestions: [] },
  { path: ['c'], message: 'expected string, got number', suggestions: [] },
  { path: [], message: 'unexpected properties: "e"', suggestions: RFC_ALL_PROPS }
]);
testCase('properties RFC 3.3.6 additionalProperties true filters unexpected', RFC_ADDITIONAL, {
  b: 3,
  c: 3,
  e: 3
}, [
  { path: [], message: 'missing required property "a"', suggestions: [] },
  { path: ['b'], message: 'expected string, got number', suggestions: [] },
  { path: ['c'], message: 'expected string, got number', suggestions: [] }
]);

// Nullable
const RFC_NULLABLE: Schema = { ...RFC_SCHEMA, nullable: true };

testCase('properties nullable true accepts null', RFC_NULLABLE, null);
testCase('properties nullable true still validates non-null', RFC_NULLABLE, { a: 1, b: 'y' }, [{
  path: ['a'],
  message: 'expected string, got number',
  suggestions: []
}]);

// Edge cases
const OPTIONAL_ONLY: Schema = { optionalProperties: { a: { type: 'string' } } };

testCase('properties only optionalProperties accepts empty object', OPTIONAL_ONLY, {});
testCase('properties only optionalProperties accepts valid optional', OPTIONAL_ONLY, {
  a: 'hello'
});
testCase('properties only optionalProperties rejects type mismatch', OPTIONAL_ONLY, { a: 1 }, [{
  path: ['a'],
  message: 'expected string, got number',
  suggestions: []
}]);

const REQUIRED_ONLY: Schema = { properties: { a: { type: 'string' } } };

testCase('properties only properties accepts valid', REQUIRED_ONLY, { a: 'hello' });
testCase('properties only properties rejects missing', REQUIRED_ONLY, {}, [{
  path: [],
  message: 'missing required property "a"',
  suggestions: []
}]);

const EMPTY_PROPS: Schema = { properties: {} };

testCase('properties empty properties accepts {}', EMPTY_PROPS, {});
testCase('properties empty properties rejects extra keys', EMPTY_PROPS, { a: 1 }, [{
  path: [],
  message: 'unexpected properties: "a"',
  suggestions: []
}]);

testCase('properties array rejected (not object)', RFC_SCHEMA, [], [{
  path: [],
  message: 'expected JSON object, got array',
  suggestions: []
}]);

// Nested properties
const NESTED_PROPS_SCHEMA: Schema = {
  properties: {
    user: {
      properties: { id: { type: 'string' }, name: { type: 'string' } },
      optionalProperties: { email: { type: 'string' } }
    }
  }
};

testCase('properties nested properties accepts required only', NESTED_PROPS_SCHEMA, {
  user: { id: '1', name: 'Alice' }
});
testCase('properties nested properties accepts with optional', NESTED_PROPS_SCHEMA, {
  user: { id: '1', name: 'Alice', email: 'a@b.com' }
});
testCase('properties nested properties missing deep required', NESTED_PROPS_SCHEMA, {
  user: { id: '1' }
}, [{ path: ['user'], message: 'missing required property "name"', suggestions: [] }]);
testCase('properties nested properties type mismatch at depth', NESTED_PROPS_SCHEMA, {
  user: { id: '1', name: 3 }
}, [{ path: ['user', 'name'], message: 'expected string, got number', suggestions: [] }]);
testCase('properties nested properties missing top-level required', NESTED_PROPS_SCHEMA, {}, [{
  path: [],
  message: 'missing required property "user"',
  suggestions: []
}]);

// Nested elements
const NESTED_ELEMS_SCHEMA: Schema = {
  properties: {
    tags: { elements: { type: 'string' } }
  }
};

testCase('properties nested elements accepts empty array', NESTED_ELEMS_SCHEMA, { tags: [] });
testCase('properties nested elements accepts values', NESTED_ELEMS_SCHEMA, { tags: ['a', 'b'] });
testCase('properties nested elements type mismatch at index', NESTED_ELEMS_SCHEMA, { tags: [1] }, [{
  path: ['tags', 0],
  message: 'expected string, got number',
  suggestions: []
}]);
testCase('properties nested elements not an array', NESTED_ELEMS_SCHEMA, { tags: 'foo' }, [{
  path: ['tags'],
  message: 'expected array, got string',
  suggestions: []
}]);

// Mixed nesting
const MIXED_SCHEMA: Schema = {
  properties: {
    items: {
      elements: {
        properties: { id: { type: 'float32' }, label: { type: 'string' } }
      }
    }
  }
};

testCase('properties mixed elements containing properties accepts empty', MIXED_SCHEMA, {
  items: []
});
testCase('properties mixed elements containing properties accepts values', MIXED_SCHEMA, {
  items: [{ id: 1, label: 'foo' }, { id: 2, label: 'bar' }]
});
testCase('properties mixed type mismatch at element property', MIXED_SCHEMA, {
  items: [{ id: 'bad', label: 'foo' }]
}, [{ path: ['items', 0, 'id'], message: 'expected float32, got string', suggestions: [] }]);
testCase('properties mixed missing required at element property', MIXED_SCHEMA, {
  items: [{ id: 1 }]
}, [{ path: ['items', 0], message: 'missing required property "label"', suggestions: [] }]);

// Deep triple nesting
const DEEP_SCHEMA: Schema = {
  properties: {
    data: {
      elements: {
        properties: { x: { type: 'float32' } }
      }
    }
  }
};

testCase('properties deep triple nesting accepted', DEEP_SCHEMA, { data: [{ x: 1 }, { x: 2 }] });
testCase('properties deep triple nesting error at depth', DEEP_SCHEMA, { data: [{ x: 'bad' }] }, [{
  path: ['data', 0, 'x'],
  message: 'expected float32, got string',
  suggestions: []
}]);
