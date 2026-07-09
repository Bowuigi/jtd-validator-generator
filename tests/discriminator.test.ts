import type { Schema } from '@/mod.ts';
import { testCase } from './setup.ts';

const DISCRIMINATOR_SCHEMA: Schema = {
  discriminator: 'version',
  mapping: {
    v1: { properties: { a: { type: 'float32' } } },
    v2: { properties: { a: { type: 'string' } } }
  }
};

testCase('discriminator valid v1 accepted', DISCRIMINATOR_SCHEMA, { version: 'v1', a: 1.5 });
testCase('discriminator valid v2 accepted', DISCRIMINATOR_SCHEMA, { version: 'v2', a: 'hello' });
testCase(
  'discriminator tag exemption - discriminator key not flagged as extra',
  DISCRIMINATOR_SCHEMA,
  { version: 'v1', a: 1.5 }
);
testCase('discriminator null rejected (not an object)', DISCRIMINATOR_SCHEMA, null, [{
  path: [],
  message: 'expected object',
  suggestions: []
}]);
testCase('discriminator string rejected (not an object)', DISCRIMINATOR_SCHEMA, 'string', [{
  path: [],
  message: 'expected object',
  suggestions: []
}]);
testCase('discriminator missing discriminator tag', DISCRIMINATOR_SCHEMA, {}, [{
  path: [],
  message: 'missing discriminator "version"',
  suggestions: ['v1', 'v2']
}]);
testCase('discriminator tag not a string', DISCRIMINATOR_SCHEMA, { version: 1 }, [{
  path: ['version'],
  message: 'discriminator must be a string',
  suggestions: []
}]);
testCase('discriminator unknown discriminator value', DISCRIMINATOR_SCHEMA, { version: 'v3' }, [{
  path: ['version'],
  message: 'unknown discriminator value "v3"',
  suggestions: ['v1', 'v2']
}]);
testCase('discriminator property type mismatch in mapping', DISCRIMINATOR_SCHEMA, {
  version: 'v2',
  a: 3
}, [{ path: ['a'], message: 'expected string, got number', suggestions: [] }]);
testCase('discriminator extra property on mapping variant', DISCRIMINATOR_SCHEMA, {
  version: 'v1',
  a: 1.5,
  extra: 'x'
}, [{ path: ['extra'], message: 'unexpected property "extra"', suggestions: [] }]);

const NULLABLE_DISCRIMINATOR: Schema = { ...DISCRIMINATOR_SCHEMA, nullable: true };

testCase('discriminator nullable: true accepts null', NULLABLE_DISCRIMINATOR, null);
testCase('discriminator nullable: true non-null still validated', NULLABLE_DISCRIMINATOR, {
  version: 'v2',
  a: 3
}, [{ path: ['a'], message: 'expected string, got number', suggestions: [] }]);

const COMPLEX_DISCRIMINATOR_SCHEMA: Schema = {
  discriminator: 'event_type',
  mapping: {
    account_deleted: {
      properties: { account_id: { type: 'string' } }
    },
    account_payment_plan_changed: {
      properties: {
        account_id: { type: 'string' },
        payment_plan: { enum: ['FREE', 'PAID'] }
      },
      optionalProperties: {
        upgraded_by: { type: 'string' }
      }
    }
  }
};

testCase(
  'discriminator complex mapping variant account_deleted accepted',
  COMPLEX_DISCRIMINATOR_SCHEMA,
  { event_type: 'account_deleted', account_id: 'abc-123' }
);
testCase(
  'discriminator complex mapping variant account_payment_plan_changed accepted',
  COMPLEX_DISCRIMINATOR_SCHEMA,
  { event_type: 'account_payment_plan_changed', account_id: 'abc-123', payment_plan: 'PAID' }
);
testCase(
  'discriminator complex mapping with optional property accepted',
  COMPLEX_DISCRIMINATOR_SCHEMA,
  {
    event_type: 'account_payment_plan_changed',
    account_id: 'abc-123',
    payment_plan: 'PAID',
    upgraded_by: 'users/mkhwarizmi'
  }
);
testCase('discriminator complex mapping extra property rejected', COMPLEX_DISCRIMINATOR_SCHEMA, {
  event_type: 'account_payment_plan_changed',
  account_id: 'abc-123',
  payment_plan: 'PAID',
  xxx: 'asdf'
}, [{ path: ['xxx'], message: 'unexpected property "xxx"', suggestions: [] }]);
testCase('discriminator complex mapping missing required property', COMPLEX_DISCRIMINATOR_SCHEMA, {
  event_type: 'account_deleted'
}, [{ path: [], message: 'missing required property "account_id"', suggestions: [] }]);

// Nested discriminators
const PROPS_CONTAINING_DISCRIMINATOR: Schema = {
  properties: {
    data: {
      discriminator: 'type',
      mapping: {
        foo: { properties: { x: { type: 'float32' } } },
        bar: { properties: { y: { type: 'string' } } }
      }
    }
  }
};

testCase(
  'discriminator nested inside properties - valid foo accepted',
  PROPS_CONTAINING_DISCRIMINATOR,
  { data: { type: 'foo', x: 1.5 } }
);
testCase(
  'discriminator nested inside properties - valid bar accepted',
  PROPS_CONTAINING_DISCRIMINATOR,
  { data: { type: 'bar', y: 'hello' } }
);
testCase(
  'discriminator nested inside properties - unknown discriminator value at depth',
  PROPS_CONTAINING_DISCRIMINATOR,
  { data: { type: 'baz' } },
  [{
    path: ['data', 'type'],
    message: 'unknown discriminator value "baz"',
    suggestions: ['foo', 'bar']
  }]
);
testCase(
  'discriminator nested inside properties - type mismatch at depth',
  PROPS_CONTAINING_DISCRIMINATOR,
  { data: { type: 'foo', x: 'bad' } },
  [{ path: ['data', 'x'], message: 'expected float32, got string', suggestions: [] }]
);
testCase(
  'discriminator nested inside properties - extra property on variant at depth',
  PROPS_CONTAINING_DISCRIMINATOR,
  { data: { type: 'foo', x: 1.5, extra: 'x' } },
  [{ path: ['data', 'extra'], message: 'unexpected property "extra"', suggestions: [] }]
);

const VALUES_CONTAINING_DISCRIMINATOR: Schema = {
  values: {
    discriminator: 'kind',
    mapping: {
      a: { properties: { val: { type: 'float32' } } },
      b: { properties: { val: { type: 'string' } } }
    }
  }
};

testCase(
  'discriminator nested inside values - all valid accepted',
  VALUES_CONTAINING_DISCRIMINATOR,
  { key1: { kind: 'a', val: 1.5 }, key2: { kind: 'b', val: 'hello' } }
);
testCase(
  'discriminator nested inside values - type mismatch at depth',
  VALUES_CONTAINING_DISCRIMINATOR,
  { key: { kind: 'a', val: 'bad' } },
  [{ path: ['key', 'val'], message: 'expected float32, got string', suggestions: [] }]
);
testCase(
  'discriminator nested inside values - unknown discriminator value at depth',
  VALUES_CONTAINING_DISCRIMINATOR,
  { key: { kind: 'c' } },
  [{ path: ['key', 'kind'], message: 'unknown discriminator value "c"', suggestions: ['a', 'b'] }]
);

const ELEMS_CONTAINING_DISCRIMINATOR: Schema = {
  elements: {
    discriminator: 'type',
    mapping: {
      foo: { properties: { id: { type: 'float32' } } },
      bar: { properties: { id: { type: 'string' } } }
    }
  }
};

testCase(
  'discriminator nested inside elements - all valid accepted',
  ELEMS_CONTAINING_DISCRIMINATOR,
  [{ type: 'foo', id: 1 }, { type: 'bar', id: 'x' }]
);
testCase(
  'discriminator nested inside elements - type mismatch at index',
  ELEMS_CONTAINING_DISCRIMINATOR,
  [{ type: 'foo', id: 'bad' }],
  [{ path: [0, 'id'], message: 'expected float32, got string', suggestions: [] }]
);

const DISCRIMINATOR_CONTAINING_ELEMS: Schema = {
  discriminator: 'type',
  mapping: {
    withArray: {
      properties: {
        items: { elements: { type: 'string' } }
      }
    }
  }
};

testCase('discriminator containing elements - valid accepted', DISCRIMINATOR_CONTAINING_ELEMS, {
  type: 'withArray',
  items: ['a', 'b']
});
testCase(
  'discriminator containing elements - error at array index under property',
  DISCRIMINATOR_CONTAINING_ELEMS,
  { type: 'withArray', items: [1] },
  [{ path: ['items', 0], message: 'expected string, got number', suggestions: [] }]
);

const DISCRIMINATOR_CONTAINING_VALUES: Schema = {
  discriminator: 'type',
  mapping: {
    withDict: {
      properties: {
        dict: { values: { type: 'float32' } }
      }
    }
  }
};

testCase('discriminator containing values - valid accepted', DISCRIMINATOR_CONTAINING_VALUES, {
  type: 'withDict',
  dict: { x: 1, y: 2 }
});
testCase(
  'discriminator containing values - error at map key under property',
  DISCRIMINATOR_CONTAINING_VALUES,
  { type: 'withDict', dict: { x: 'bad' } },
  [{ path: ['dict', 'x'], message: 'expected float32, got string', suggestions: [] }]
);

const NESTED_DISCRIMINATOR: Schema = {
  discriminator: 'outer',
  mapping: {
    inner: {
      properties: {
        payload: {
          discriminator: 'innerType',
          mapping: {
            a: { properties: { val: { type: 'float32' } } },
            b: { properties: { val: { type: 'string' } } }
          }
        }
      }
    }
  }
};

testCase('nested discriminator - valid inner a accepted', NESTED_DISCRIMINATOR, {
  outer: 'inner',
  payload: { innerType: 'a', val: 1.5 }
});
testCase('nested discriminator - valid inner b accepted', NESTED_DISCRIMINATOR, {
  outer: 'inner',
  payload: { innerType: 'b', val: 'hello' }
});
testCase('nested discriminator - error at depth in inner discriminator', NESTED_DISCRIMINATOR, {
  outer: 'inner',
  payload: { innerType: 'a', val: 'bad' }
}, [{ path: ['payload', 'val'], message: 'expected float32, got string', suggestions: [] }]);

const NULLABLE_NESTED_DISCRIMINATOR = { ...NESTED_DISCRIMINATOR, nullable: true };

testCase(
  'nested discriminator with nullable outer - null accepted',
  NULLABLE_NESTED_DISCRIMINATOR,
  null
);
testCase(
  'nested discriminator with nullable outer - inner errors still reported',
  NULLABLE_NESTED_DISCRIMINATOR,
  { outer: 'inner', payload: { innerType: 'a', val: 'bad' } },
  [{ path: ['payload', 'val'], message: 'expected float32, got string', suggestions: [] }]
);
