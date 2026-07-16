//// The AST itself

export type AST =
  | string
  | { is: 'validatorFunction', name: string, body: AST }
  | { is: 'formBlock', form: string, bindings: Record<string, AST>, body: AST }
  | { is: 'ifElse', cond: AST, ifTrue: AST, ifFalse: AST }
  | { is: 'iterateOver', iterator: AST, body: AST }
  | { is: 'when', cond: AST, ifTrue: AST }
  | { is: 'unless', cond: AST, ifFalse: AST }
  | { is: 'dataIs', type: string }
  | { is: 'pushError', msg: string, suggestions: AST }
  | { is: 'array', items: Array<string> };

//// Smart constructors

export function validatorFunction(name: string, body: AST): AST {
  return { is: 'validatorFunction', name, body };
}
export function formBlock(form: string, bindings: Record<string, AST>, body: AST): AST {
  return { is: 'formBlock', form, bindings, body };
}
export function ifElse(cond: AST, ifTrue: AST, ifFalse: AST): AST {
  return { is: 'ifElse', cond, ifTrue, ifFalse };
}
export function iterateOver(iterator: AST, body: AST): AST {
  return { is: 'iterateOver', iterator, body };
}
export function when(cond: AST, ifTrue: AST): AST {
  return { is: 'when', cond, ifTrue };
}
export function unless(cond: AST, ifFalse: AST): AST {
  return { is: 'unless', cond, ifFalse };
}
export function dataIs(type: string): AST {
  return { is: 'dataIs', type };
}
export function pushError(msg: string, suggestions: AST): AST {
  return { is: 'pushError', msg, suggestions };
}
export function array(items: Array<string>): AST {
  return { is: 'array', items };
}

//// Rendering

function render(ast: AST): string {
  if (typeof ast === 'string') {
    return ast;
  }

  switch (ast.is) {
    case 'validatorFunction':
      return `function validate${ast.name}(data: unknown, path: Path, errors: Errors): void {${
        render(ast.body)
      }}`;
    case 'formBlock': {
      const bindings = Object.entries(ast.bindings).map(([variable, value]) =>
        `const ${variable} = ${render(value)}`
      );
      return `{/* ${ast.form} */ ${bindings.join(';')}; ${render(ast.body)} }`;
    }
    case 'ifElse':
      return `if (${render(ast.cond)}) {${render(ast.ifTrue)}} else {${render(ast.ifFalse)}}`;
    case 'iterateOver':
      return `for (const [key, value] of ${render(ast.iterator)}) {path.push(key); const data = value; ${render(ast.body)}; path.pop()}`;
    case 'when':
      return `if (${render(ast.cond)}) {${render(ast.ifTrue)}}`;
    case 'unless':
      return `if (! ${render(ast.cond)}) {${render(ast.ifFalse)}}`;
    case 'dataIs':
      switch (ast.type) {
        case 'array':
          return `(Array.isArray(data))`;
        case 'null':
          return `(data === null)`;
        default:
          return `(typeof data === '${ast.type}')`;
      }
    case 'pushError': {
      return `errors.push({path: [...path], message: \`${ast.msg}\`, suggestions: ${
        render(ast.suggestions)
      }});`;
    }
    case 'array':
      return `[${ast.items.map((x) => `"${x}"`).join(', ')}]`;
  }
}

export function renderProgram(validatorFunctions: Array<AST>): string {
  const entrypoint = `\
type Path = Array<string | number>;
type Errors = Array<{ path: Path, message: string, suggestions: Array<string> }>;
export type ValidationResult = { success: true } | { success: false, errors: Errors };

export function validate(data: unknown): ValidationResult {
  const path: /* mutable */ Path = [];
  const errors: /* mutable */ Errors = [];

  validateMain(data, path, errors);

  if (errors.length > 0) {
    return {success: false, errors};
  }
  return {success: true};
}`;
  return [entrypoint, ...validatorFunctions.map(render)].join('\n\n');
}
