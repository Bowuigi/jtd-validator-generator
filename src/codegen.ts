//// The AST itself

export type AST =
  | string
  | { is: 'validatorFunction', name: string, body: AST }
  | { is: 'formBlock', form: string, bindings: Record<string, AST>, body: AST }
  | { is: 'ifElse', cond: AST, ifTrue: AST, ifFalse: AST }
  | { is: 'unless', cond: AST, ifFalse: AST }
  | { is: 'dataIs', type: string }
  | { is: 'pushError', msg: string, suggestions: AST }
  | { is: 'extendPath', extensions: Array<string>, body: AST }
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
export function unless(cond: AST, ifFalse: AST): AST {
  return { is: 'unless', cond, ifFalse };
}
export function dataIs(type: string): AST {
  return { is: 'dataIs', type };
}
export function pushError(msg: string, suggestions: AST): AST {
  return { is: 'pushError', msg, suggestions };
}
export function extendPath(extensions: Array<string>, body: AST): AST {
  return { is: 'extendPath', extensions, body };
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
      return `function validate${ast.name}(data: unknown, path: Path, errors: Errors) {${
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
    case 'unless':
      return `if (! ${render(ast.cond)}) {${render(ast.ifFalse)}}`;
    case 'dataIs':
      return `(typeof data === '${ast.type}')`;
    case 'pushError': {
      return `errors.push({path, message: \`${ast.msg}\`, suggestions: ${
        render(ast.suggestions)
      }});`;
    }
    case 'extendPath': {
      const newPath = `[...oldPath, ${ast.extensions.map((x) => `"${x}"`).join(', ')}]`;
      return `const oldPath = path; const path = ${newPath}; ${render(ast.body)}`;
    }
    case 'array':
      return `[${ast.items.map((x) => `"${x}"`).join(', ')}]`;
  }
}

export function renderProgram(validatorFunctions: Array<AST>): string {
  const entrypoint = `\
type Path = Array<string | number>;
type Errors = Array<{ path: Array<string | number>, message: string, suggestions: Array<string> }>;

export function validate(data: unknown) {
  const path: Path = [];
  const errors: Errors = [];

  validateMain(data, path, errors);

  if (errors.length > 0) {
    return {success: false, errors};
  }
  return {success: true};
}`;
  return [entrypoint, ...validatorFunctions.map(render)].join('\n\n');
}
