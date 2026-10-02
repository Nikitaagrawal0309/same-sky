/**
 * CI helper: turns the rules-test log into GitHub annotations, which are
 * readable on the public run page (raw job logs need a signed-in owner).
 */
import { existsSync, readFileSync } from "node:fs";

const file = process.argv[2] ?? "rules-test.log";

if (!existsSync(file)) {
  console.log(`::error title=Rules tests::No log file (${file}) was produced.`);
  process.exit(0);
}

const lines = readFileSync(file, "utf8").replace(/\r/g, "").split("\n");
const encode = (text) => text.replace(/%/g, "%25").replace(/\n/g, "%0A");

const interesting = lines.filter((line) => /not ok|Error|error|PERMISSION|expected|failed|✖|Assertion/.test(line)).slice(0, 80);

console.log(`::error title=Rules tests (matches)::${encode(interesting.join("\n"))}`);
console.log(`::error title=Rules tests (last lines)::${encode(lines.slice(-60).join("\n"))}`);
