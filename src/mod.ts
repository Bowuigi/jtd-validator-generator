import * as CG from '@/codegen.ts';

type BaseForm = {
  nullable?: boolean,
  metadata?: Record<string, unknown>
};

type DiscriminatorForm = BaseForm & {
  discriminator: string,
  mapping: Record<string, PropertiesForm>
};
type ElementsForm = BaseForm & { elements: SomeForm };
type EmptyForm = BaseForm;
type EnumForm = BaseForm & { enum: Array<string> };
type PropertiesForm = BaseForm & {
  properties?: Record<string, SomeForm>,
  optionalProperties?: Record<string, SomeForm>,
  additionalProperties?: boolean
};
type RefForm = BaseForm & { ref: string };
type TypeForm = BaseForm & {
  type:
    | 'boolean'
    | 'float32'
    | 'float64'
    | 'int16'
    | 'int32'
    | 'int8'
    | 'string'
    | 'timestamp'
    | 'uint16'
    | 'uint32'
    | 'uint8'
};
type ValuesForm = BaseForm & { values: SomeForm };

type SomeForm =
  | DiscriminatorForm
  | ElementsForm
  | EmptyForm
  | EnumForm
  | PropertiesForm
  | RefForm
  | TypeForm
  | ValuesForm;

export type Schema = {
  definitions?: Record<string, SomeForm>
} & SomeForm;

const interpolatedTypeOfData = '${data === null ? "null" : typeof data}';

function generateElements(elements: SomeForm): CG.AST {
  return CG.ifElse(
    CG.dataIs('array'),
    CG.iterateOver('data.entries()', onForm(elements)),
    CG.pushError(`expected array, got ${interpolatedTypeOfData}`, CG.array([]))
  );
}

function generateType(type: TypeForm['type']): CG.AST {
  const ranges = {
    float32: { min: -3.40282347e+38, max: 3.4028234663852886e+38 },
    int8: { min: -128, max: 127 },
    uint8: { min: 0, max: 255 },
    int16: { min: -32768, max: 32767 },
    uint16: { min: 0, max: 65535 },
    int32: { min: -2147483648, max: 2147483647 },
    uint32: { min: 0, max: 4294967295 }
  } as const;

  switch (type) {
    case 'string':
    case 'boolean':
      return CG.unless(
        CG.dataIs(type),
        CG.pushError(`expected ${type}, got ${interpolatedTypeOfData}`, CG.array([]))
      );

    // NOTE: Based on https://stackoverflow.com/a/28022901 , same caveats apply (no 0000-0999 year, no leap second, offset limited to +/- 19:59) though support for fractional seconds was added using `(?:\\.[0-9]+)?`
    case 'timestamp':
      return CG.ifElse(
        CG.dataIs('string'),
        CG.unless(
          '(/^(?:[1-9]\\d{3}-(?:(?:0[1-9]|1[0-2])-(?:0[1-9]|1\\d|2[0-8])|(?:0[13-9]|1[0-2])-(?:29|30)|(?:0[13578]|1[02])-31)|(?:[1-9]\\d(?:0[48]|[2468][048]|[13579][26])|(?:[2468][048]|[13579][26])00)-02-29)T(?:[01]\\d|2[0-3]):[0-5]\\d:[0-5]\\d(?:\\.[0-9]+)?(?:Z|[+-][01]\\d:[0-5]\\d)$/.test(data))',
          CG.pushError('expected timestamp, got string', CG.array([]))
        ),
        CG.pushError(`expected timestamp, got ${interpolatedTypeOfData}`, CG.array([]))
      );

    // NOTE: NaN and +/- Infinity do not exist in JSON, so this is the same as Number.isFinite
    case 'float64':
      return CG.unless(
        CG.dataIs('number'),
        CG.pushError(`expected ${type}, got ${interpolatedTypeOfData}`, CG.array([]))
      );

    case 'float32':
      return CG.ifElse(
        CG.dataIs('number'),
        CG.unless(
          `(data >= ${ranges[type].min} && data <= ${ranges[type].max})`,
          CG.pushError(`value \${data} out of range for ${type}`, CG.array([]))
        ),
        CG.pushError(`expected ${type}, got ${interpolatedTypeOfData}`, CG.array([]))
      );

    case 'int16':
    case 'int32':
    case 'int8':
    case 'uint16':
    case 'uint32':
    case 'uint8':
      return CG.ifElse(
        CG.dataIs('number'),
        CG.ifElse(
          `(data >= ${ranges[type].min} && data <= ${ranges[type].max})`,
          CG.unless(
            'Number.isInteger(data)',
            CG.pushError(
              `value \${data} is not an ${type.startsWith('u') ? 'unsigned ' : ''}integer`,
              CG.array([])
            )
          ),
          CG.pushError(`value \${data} out of range for ${type}`, CG.array([]))
        ),
        CG.pushError(`expected ${type}, got ${interpolatedTypeOfData}`, CG.array([]))
      );
  }
}

function generateEnum(options: Array<string>): CG.AST {
  return CG.formBlock(
    'enum',
    { enum_: CG.array(options) },
    CG.ifElse(
      CG.dataIs('string'),
      CG.unless('enum_.includes(data)', CG.pushError('unexpected "${data}"', 'enum_')),
      CG.pushError(`unexpected ${interpolatedTypeOfData}`, 'enum_')
    )
  );
}

function onForm(form: SomeForm): CG.AST {
  const continuation: (rest: CG.AST) => CG.AST = form.nullable
    ? (rest) => CG.unless(CG.dataIs('null'), rest)
    : (rest) => rest;

  if ('enum' in form) {
    return continuation(generateEnum(form.enum));
  } else if ('type' in form) {
    return continuation(generateType(form.type));
  } else if ('elements' in form) {
    return continuation(generateElements(form.elements));
  } else {
    throw Error('Unreachable code reached, possibly due to an invalid JTD schema');
  }
}

export function generateCode(schema: Schema): string {
  const definitions = Object.entries(schema.definitions ?? {}).map(([defn, value]) =>
    CG.validatorFunction(`_${defn}`, onForm(value))
  );
  return CG.renderProgram([CG.validatorFunction('Main', onForm(schema)), ...definitions]);
}
