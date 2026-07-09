import { testCase } from "./setup.ts";

const EMPTY_ACCEPTS = [null, true, false, 123, "string", [], {}];
for (const value of EMPTY_ACCEPTS) {
  testCase(`empty {} accepts ${JSON.stringify(value)}`, {}, value);
}

testCase('{ nullable: true } accepts null', { nullable: true }, null);

testCase('{ metadata: { foo: "bar" } } accepts any value', { metadata: { foo: "bar" } }, 42);
