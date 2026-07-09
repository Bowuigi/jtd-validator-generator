type BaseForm = {
  nullable?: boolean,
  metadata?: Record<string, unknown>,
};

type DiscriminatorForm = BaseForm & {discriminator: string, mapping: Record<string, PropertiesForm>};
type ElementsForm = BaseForm & {elements: SomeForm};
type EmptyForm = BaseForm;
type EnumForm = BaseForm & {enum: Array<string>};
type PropertiesForm = BaseForm & {properties?: Record<string, SomeForm>, optionalProperties?: Record<string, SomeForm>, additionalProperties: boolean};
type RefForm = BaseForm & {ref: string};
type TypeForm = BaseForm & {type: "boolean" | "float32" | "float64" | "int16" | "int32" | "int8" | "string" | "timestamp" | "uint16" | "uint32" | "uint8"};
type ValuesForm = BaseForm & {values: SomeForm};

type SomeForm = DiscriminatorForm | ElementsForm | EmptyForm | EnumForm | PropertiesForm | RefForm | TypeForm | ValuesForm;

export type Schema = {
  definitions?: Record<string, SomeForm>,
} & SomeForm;

export function generateCode(_schema: Schema): string {
  return 'export function validate(data: unknown) {return {success: false, errors: []};}';
}
