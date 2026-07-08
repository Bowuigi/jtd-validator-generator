export function generateCode(schema: any): string {
  return 'export function validate(data: unknown) {return {success: false, errors: []};}';
}
