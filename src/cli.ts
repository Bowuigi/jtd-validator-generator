import { generateCode } from './mod.ts';

try {
  const [filename] = Deno.args;
  if (!filename) throw new Error('Missing filename');

  const contents = await Deno.readTextFile(filename);

  const json = JSON.parse(contents);

  // deno-lint-ignore no-console
  console.log(generateCode(json));
} catch (exn: unknown) {
  if (exn instanceof Error) {
    // deno-lint-ignore no-console
    console.error(`${exn.name}:`, exn.message);
  } else {
    // deno-lint-ignore no-console
    console.error(exn);
  }
}
