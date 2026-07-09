import { testCase } from "./setup.ts";

const STATUS_SCHEMA = { enum: ["PENDING", "DONE", "CANCELED"] };
const STATUSES = ["PENDING", "DONE", "CANCELED"];

for (const status of STATUSES) {
  testCase(`enum accepts "${status}"`, STATUS_SCHEMA, status);
}

testCase('enum rejects "UNKNOWN"', STATUS_SCHEMA, "UNKNOWN", [{ path: [], message: 'unexpected "UNKNOWN"', suggestions: STATUSES }]);
testCase("enum rejects 123", STATUS_SCHEMA, 123, [{ path: [], message: 'unexpected "123"', suggestions: STATUSES }]);
testCase("enum rejects null", STATUS_SCHEMA, null, [{ path: [], message: 'unexpected "null"', suggestions: STATUSES }]);

const NULLABLE_ENUM_SCHEMA = { enum: ["PENDING", "DONE", "CANCELED"], nullable: true };

testCase("enum with nullable: true accepts null", NULLABLE_ENUM_SCHEMA, null);
testCase('enum with nullable: true still accepts "PENDING"', NULLABLE_ENUM_SCHEMA, "PENDING");
testCase('enum with nullable: true still rejects "UNKNOWN"', NULLABLE_ENUM_SCHEMA, "UNKNOWN", [{ path: [], message: 'unexpected "UNKNOWN"', suggestions: STATUSES }]);

testCase('single-value enum accepts "ONLY"', { enum: ["ONLY"] }, "ONLY");
testCase('single-value enum rejects "OTHER"', { enum: ["ONLY"] }, "OTHER", [{ path: [], message: 'unexpected "OTHER"', suggestions: ["ONLY"] }]);
