import { testCase } from './setup.ts';

// --- boolean ---

testCase('type boolean accepts true', { type: 'boolean' }, true);
testCase('type boolean accepts false', { type: 'boolean' }, false);
testCase('type boolean rejects "true"', { type: 'boolean' }, 'true', [{
  path: [],
  message: 'expected boolean, got string',
  suggestions: []
}]);
testCase('type boolean rejects 123', { type: 'boolean' }, 123, [{
  path: [],
  message: 'expected boolean, got number',
  suggestions: []
}]);
testCase('type boolean rejects null', { type: 'boolean' }, null, [{
  path: [],
  message: 'expected boolean, got null',
  suggestions: []
}]);

// --- float32 / float64 ---

for (const t of ['float32', 'float64'] as const) {
  testCase(`type ${t} accepts 0`, { type: t }, 0);
  testCase(`type ${t} accepts -3.14`, { type: t }, -3.14);
  testCase(`type ${t} accepts 1e10`, { type: t }, 1e10);
  testCase(`type ${t} rejects "abc"`, { type: t }, 'abc', [{
    path: [],
    message: `expected ${t}, got string`,
    suggestions: []
  }]);
  testCase(`type ${t} rejects null`, { type: t }, null, [{
    path: [],
    message: `expected ${t}, got null`,
    suggestions: []
  }]);
}

// --- integer types ---

const INT_TYPES = {
  int8: { min: -128, max: 127 },
  uint8: { min: 0, max: 255 },
  int16: { min: -32768, max: 32767 },
  uint16: { min: 0, max: 65535 },
  int32: { min: -2147483648, max: 2147483647 },
  uint32: { min: 0, max: 4294967295 }
} as const;

for (const [_type, { min, max }] of Object.entries(INT_TYPES)) {
  // Typescript forgets the type otherwise
  const type = _type as keyof typeof INT_TYPES;

  const isSigned = min !== 0;

  testCase(`type ${type} accepts 0`, { type }, 0);
  if (isSigned) testCase(`type ${type} accepts ${min}`, { type }, min);
  testCase(`type ${type} accepts ${max}`, { type }, max);
  testCase(`type ${type} accepts ${max}.0`, { type }, max);
  if (isSigned) testCase(`type ${type} accepts ${min}.0`, { type }, min);
  testCase(`type ${type} accepts 1.0e1`, { type }, 1.0e1);
  testCase(`type ${type} rejects ${max + 1} (above max)`, { type }, max + 1, [{
    path: [],
    message: `value ${max + 1} out of range for ${type}`,
    suggestions: []
  }]);
  testCase(`type ${type} rejects ${min - 1} (below min)`, { type }, min - 1, [{
    path: [],
    message: `value ${min - 1} out of range for ${type}`,
    suggestions: []
  }]);
  testCase(`type ${type} rejects 10.5 (fractional)`, { type }, 10.5, [{
    path: [],
    message: `value 10.5 is not an ${type.startsWith('u') ? 'unsigned ' : ''}integer`,
    suggestions: []
  }]);
  testCase(`type ${type} rejects "abc" (wrong JSON type)`, { type }, 'abc', [{
    path: [],
    message: `expected ${type}, got string`,
    suggestions: []
  }]);
  testCase(`type ${type} rejects null`, { type }, null, [{
    path: [],
    message: `expected ${type}, got null`,
    suggestions: []
  }]);
}

// --- string ---

testCase('type string accepts "hello"', { type: 'string' }, 'hello');
testCase('type string accepts ""', { type: 'string' }, '');
testCase('type string rejects 123', { type: 'string' }, 123, [{
  path: [],
  message: 'expected string, got number',
  suggestions: []
}]);
testCase('type string rejects null', { type: 'string' }, null, [{
  path: [],
  message: 'expected string, got null',
  suggestions: []
}]);

// --- timestamp ---

testCase(
  'type timestamp accepts "1985-04-12T23:20:50.52Z"',
  { type: 'timestamp' },
  '1985-04-12T23:20:50.52Z'
);
testCase(
  'type timestamp accepts "1996-12-19T16:39:57-08:00"',
  { type: 'timestamp' },
  '1996-12-19T16:39:57-08:00'
);
testCase(
  'type timestamp accepts "1996-12-19T16:39:57.123-08:00"',
  { type: 'timestamp' },
  '1996-12-19T16:39:57.123-08:00'
);
testCase('type timestamp rejects "foo"', { type: 'timestamp' }, 'foo', [{
  path: [],
  message: 'expected timestamp, got string',
  suggestions: []
}]);
testCase('type timestamp rejects "2020-01-01" (no time)', { type: 'timestamp' }, '2020-01-01', [{
  path: [],
  message: 'expected timestamp, got string',
  suggestions: []
}]);
testCase('type timestamp rejects 123', { type: 'timestamp' }, 123, [{
  path: [],
  message: 'expected timestamp, got number',
  suggestions: []
}]);
testCase('type timestamp rejects null', { type: 'timestamp' }, null, [{
  path: [],
  message: 'expected timestamp, got null',
  suggestions: []
}]);
