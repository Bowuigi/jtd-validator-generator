import { testCase } from './setup.ts';

// Empty form
testCase('nullable: true on empty form accepts null', { nullable: true }, null);

// Type form
testCase('nullable: true on type form accepts null', { type: 'string', nullable: true }, null);

// Enum form
testCase('nullable: true on enum form accepts null', { enum: ['A'], nullable: true }, null);

// Elements form
testCase('nullable: true on elements form accepts null', {
  elements: { type: 'string' },
  nullable: true
}, null);

// Properties form
testCase('nullable: true on properties form accepts null', {
  properties: { a: { type: 'string' } },
  nullable: true
}, null);

// Values form
testCase('nullable: true on values form accepts null', {
  values: { type: 'string' },
  nullable: true
}, null);

// Discriminator form
testCase('nullable: true on discriminator form accepts null', {
  discriminator: 'x',
  mapping: { a: { properties: { b: { type: 'string' } } } },
  nullable: true
}, null);

// nullable: false has no effect
testCase(
  'nullable: false on type form still rejects null',
  { type: 'string', nullable: false },
  null,
  [{ path: [], message: 'expected string, got null', suggestions: [] }]
);
testCase(
  'nullable: false on enum form still rejects null',
  { enum: ['A'], nullable: false },
  null,
  [{ path: [], message: 'unexpected null', suggestions: ['A'] }]
);
testCase(
  'nullable: false on elements form still rejects null',
  { elements: { type: 'string' }, nullable: false },
  null,
  [{ path: [], message: 'expected array, got null', suggestions: [] }]
);
testCase(
  'nullable: false on properties form still rejects null',
  { properties: { a: { type: 'string' } }, nullable: false },
  null,
  [{ path: [], message: 'expected JSON object, got null', suggestions: [] }]
);

// nullable omitted means no null accepted
testCase('type form without nullable rejects null', { type: 'string' }, null, [{
  path: [],
  message: 'expected string, got null',
  suggestions: []
}]);
testCase('enum form without nullable rejects null', { enum: ['A'] }, null, [{
  path: [],
  message: 'unexpected null',
  suggestions: ['A']
}]);
testCase('elements form without nullable rejects null', { elements: { type: 'string' } }, null, [{
  path: [],
  message: 'expected array, got null',
  suggestions: []
}]);
testCase(
  'properties form without nullable rejects null',
  { properties: { a: { type: 'string' } } },
  null,
  [{ path: [], message: 'expected JSON object, got null', suggestions: [] }]
);
testCase('values form without nullable rejects null', { values: { type: 'string' } }, null, [{
  path: [],
  message: 'expected JSON object, got null',
  suggestions: []
}]);
testCase(
  'discriminator form without nullable rejects null',
  {
    discriminator: 'x',
    mapping: { a: { properties: { b: { type: 'string' } } } }
  },
  null,
  [{ path: [], message: 'expected JSON object, got null', suggestions: [] }]
);

// nullable: true does not leak to child schemas
testCase(
  'nullable on parent does not allow null in child properties',
  { properties: { a: { type: 'string' } }, nullable: true },
  { a: null },
  [{ path: ['a'], message: 'expected string, got null', suggestions: [] }]
);
testCase(
  'nullable on parent does not allow null in child elements',
  { elements: { type: 'string' }, nullable: true },
  [null],
  [{ path: [0], message: 'expected string, got null', suggestions: [] }]
);
testCase(
  'nullable on parent does not allow null in child values',
  { values: { type: 'string' }, nullable: true },
  { key: null },
  [{ path: ['key'], message: 'expected string, got null', suggestions: [] }]
);
testCase(
  'nullable on parent does not allow null in nested optionalProperties',
  {
    properties: { a: { type: 'string' } },
    optionalProperties: { b: { type: 'float32' } },
    nullable: true
  },
  { a: 'hello', b: null },
  [{ path: ['b'], message: 'expected float32, got null', suggestions: [] }]
);
