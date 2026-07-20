import { generateCode } from '@/lib.ts';
import type { Schema } from '@/types.ts';
import { readFile } from 'node:fs/promises';
import { default as process } from 'node:process';

export { generateCode, type Schema };

async function main(): Promise<void> {
  try {
    const [_execPath, _script, filename, ...rest] = process.argv

    if (!filename || rest.length > 0) {
      throw new Error('Wrong number of arguments. Usage: jtd-validator-generator filename.jtd.json > output.ts');
    }

    const contents = await readFile(filename, {encoding: 'utf-8'});
    const json = JSON.parse(contents);

    // deno-lint-ignore no-console
    console.log(generateCode(json));
  } catch (exn: unknown) {
    if (exn instanceof Error) {
      // deno-lint-ignore no-console
      console.error(`${exn.name}:`, exn.message);
    } else {
      // deno-lint-ignore no-console
      console.error(`Fatal error:`, exn);
    }
  }
}

if (import.meta.main) {
  main();
}
