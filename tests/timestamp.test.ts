import { testCase } from './setup.ts';

const TIMESTAMP_FORMAT_ERROR = [{
  path: [],
  message: 'expected timestamp, got string',
  suggestions: []
}];

testCase('valid timestamp with Z', { type: 'timestamp' }, '1985-04-12T23:20:50Z');
testCase('valid timestamp with offset -08:00', { type: 'timestamp' }, '1996-12-19T16:39:57-08:00');
testCase(
  'valid timestamp with fractional seconds and offset',
  { type: 'timestamp' },
  '1937-01-01T12:00:27.87+00:20'
);
testCase('valid timestamp on leap year', { type: 'timestamp' }, '2000-02-29T12:00:00Z');
testCase(
  'valid timestamp with positive offset',
  { type: 'timestamp' },
  '2020-01-01T00:00:00+01:00'
);
testCase(
  'valid timestamp with fractional seconds',
  { type: 'timestamp' },
  '2020-01-01T00:00:00.123Z'
);
testCase(
  'valid timestamp with many fractional digits',
  { type: 'timestamp' },
  '2020-01-01T00:00:00.123456Z'
);
testCase('valid timestamp with zero offset', { type: 'timestamp' }, '2020-01-01T00:00:00+00:00');
testCase(
  'valid timestamp with negative offset',
  { type: 'timestamp' },
  '2020-01-01T00:00:00-05:00'
);
testCase('valid timestamp, year 9999', { type: 'timestamp' }, '9999-12-31T23:59:59Z'); // valid
testCase(
  'invalid timestamp, year 10000',
  { type: 'timestamp' },
  '10000-01-01T00:00:00Z',
  TIMESTAMP_FORMAT_ERROR
);
testCase(
  'invalid timestamp, missing T separator',
  { type: 'timestamp' },
  '2020-01-01 00:00:00Z',
  TIMESTAMP_FORMAT_ERROR
);
testCase(
  'invalid timestamp, lowercase t',
  { type: 'timestamp' },
  '2020-01-01t00:00:00Z',
  TIMESTAMP_FORMAT_ERROR
);
testCase(
  'invalid timestamp, lowercase z',
  { type: 'timestamp' },
  '2020-01-01T00:00:00z',
  TIMESTAMP_FORMAT_ERROR
);
testCase(
  'invalid timestamp, missing seconds',
  { type: 'timestamp' },
  '2020-01-01T00:00Z',
  TIMESTAMP_FORMAT_ERROR
);
testCase(
  'invalid timestamp, missing minutes',
  { type: 'timestamp' },
  '2020-01-01T00Z',
  TIMESTAMP_FORMAT_ERROR
);
testCase(
  'invalid timestamp, basic format without separators',
  { type: 'timestamp' },
  '20200101T000000Z',
  TIMESTAMP_FORMAT_ERROR
);
testCase(
  'invalid timestamp, wrong date order',
  { type: 'timestamp' },
  '01-01-2020T00:00:00Z',
  TIMESTAMP_FORMAT_ERROR
);
testCase(
  'invalid timestamp, invalid month 13',
  { type: 'timestamp' },
  '2020-13-01T00:00:00Z',
  TIMESTAMP_FORMAT_ERROR
);
testCase(
  'invalid timestamp, invalid day 30 in February',
  { type: 'timestamp' },
  '2020-02-30T00:00:00Z',
  TIMESTAMP_FORMAT_ERROR
);
testCase(
  'invalid timestamp, invalid hour 24',
  { type: 'timestamp' },
  '2020-01-01T24:00:00Z',
  TIMESTAMP_FORMAT_ERROR
);
testCase(
  'invalid timestamp, invalid minute 60',
  { type: 'timestamp' },
  '2020-01-01T00:60:00Z',
  TIMESTAMP_FORMAT_ERROR
);
testCase(
  'invalid timestamp, invalid second 61',
  { type: 'timestamp' },
  '2020-01-01T00:00:61Z',
  TIMESTAMP_FORMAT_ERROR
);
testCase(
  'invalid timestamp, offset without colon',
  { type: 'timestamp' },
  '2020-01-01T00:00:00+0100',
  TIMESTAMP_FORMAT_ERROR
);
testCase(
  'invalid timestamp, offset with hour 24',
  { type: 'timestamp' },
  '2020-01-01T00:00:00+24:00',
  TIMESTAMP_FORMAT_ERROR
);
testCase(
  'invalid timestamp, offset with minute 60',
  { type: 'timestamp' },
  '2020-01-01T00:00:00+00:60',
  TIMESTAMP_FORMAT_ERROR
);
testCase(
  'invalid timestamp, missing timezone offset',
  { type: 'timestamp' },
  '2020-01-01T00:00:00',
  TIMESTAMP_FORMAT_ERROR
);
testCase(
  'invalid timestamp, trailing extra characters',
  { type: 'timestamp' },
  '2020-01-01T00:00:00Z extra',
  TIMESTAMP_FORMAT_ERROR
);
testCase(
  'invalid timestamp, leading space',
  { type: 'timestamp' },
  ' 2020-01-01T00:00:00Z',
  TIMESTAMP_FORMAT_ERROR
);
testCase(
  'invalid timestamp, trailing space',
  { type: 'timestamp' },
  '2020-01-01T00:00:00Z ',
  TIMESTAMP_FORMAT_ERROR
);
