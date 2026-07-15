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

function generateEnum(options: Array<string>): CG.AST {
  return CG.formBlock(
    'enum',
    { enum_: CG.array(options) },
    CG.ifElse(
      CG.dataIs('string'),
      CG.unless('enum_.includes(data)', CG.pushError('unexpected "${data}"', 'enum_')),
      CG.pushError('unexpected ${data === null ? "null" : typeof data}', 'enum_')
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
