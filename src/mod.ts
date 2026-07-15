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

    case 'timestamp':
      return CG.pushError('timestamp NYI', CG.array([]));

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
  return CG.pushError('NYI', CG.array([]));
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
  const appended: /* mutable */ Array<CG.AST> = [];

  if (form.nullable) {
    appended.push(CG.when(CG.dataIs('null'), CG.earlyReturn()));
  }

  if ('enum' in form) {
    appended.push(generateEnum(form.enum));
  } else if ('type' in form) {
    appended.push(generateType(form.type));
  }

  if (appended.length === 0) {
    throw Error('Unreachable code reached, possibly due to an invalid JTD schema');
  }
  return CG.seq(appended);
}

export function generateCode(schema: Schema): string {
  const definitions = Object.entries(schema.definitions ?? {}).map(([defn, value]) =>
    CG.validatorFunction(`_${defn}`, onForm(value))
  );
  return CG.renderProgram([CG.validatorFunction('Main', onForm(schema)), ...definitions]);
}
