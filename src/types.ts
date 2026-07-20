//// The AST for the intermediate representation used. Not meant to be constructed directly

export type AST =
  | string
  | { is: 'validatorFunction', name: string, body: AST }
  | { is: 'callValidatorFunction', name: string }
  | { is: 'formBlock', form: string, bindings: Record<string, AST>, body: AST }
  | { is: 'ifElse', cond: AST, ifTrue: AST, ifFalse: AST }
  | { is: 'iterateOver', iterator: AST, body: AST }
  | { is: 'overProperty', propertyName: string, body: AST }
  | { is: 'when', cond: AST, ifTrue: AST }
  | { is: 'unless', cond: AST, ifFalse: AST }
  | { is: 'matchString', matcher: AST, patterns: Array<[string, AST]> }
  | { is: 'seq', statements: Array<AST> }
  | { is: 'dataIs', type: 'null' | 'boolean' | 'number' | 'string' | 'array' | 'json_object' }
  | { is: 'pushError', msg: string, suggestions: AST }
  | { is: 'array', items: Array<string> };

//// JSON Type Definition schema

type BaseForm = {
  nullable?: boolean,
  metadata?: Record<string, unknown>
};

export type PropertiesForm =
  & BaseForm
  & { additionalProperties?: boolean }
  & ({
    properties: Record<string, SomeForm>,
    optionalProperties?: Record<string, SomeForm>
  } | {
    properties?: Record<string, SomeForm>,
    optionalProperties: Record<string, SomeForm>
  });

type DiscriminatorForm = BaseForm & {
  discriminator: string,
  mapping: Record<string, PropertiesForm>
};

type ElementsForm = BaseForm & { elements: SomeForm };

type EmptyForm = BaseForm;

type EnumForm = BaseForm & { enum: Array<string> };

type RefForm = BaseForm & { ref: string };

export type TypeForm = BaseForm & {
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

export type SomeForm =
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
