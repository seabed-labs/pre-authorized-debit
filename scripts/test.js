const { spawn } = require("node:child_process");
const process = require("node:process");
const console = require("node:console");

let integrationTestsFailed = false;
// const isParallel = process.env.TEST_MODE !== "debug";
const isParallel = false; // disable for now due to weird race conditions

const scope = process.argv[2] ? process.argv[2] : "program-tests/**";
// init_smart_delegate must be isolated to its own anchor test due to it creating a global account
const testSuffix = process.argv[3] ? process.argv[3] : "*.test.ts";
const testCommand = `yarn run nyc ts-mocha -p ./tsconfig.json -t 1000000 ${
  isParallel ? "--parallel" : ""
} ${scope}/${testSuffix}`;

console.log("Running:", testCommand);
const [command, ...args] = testCommand.split(" ");

const integrationTests = spawn(command, args, {
  cwd: process.cwd(),
  detached: false,
  env: {
    ...process.env,
    FORCE_COLOR: true,
  },
});

integrationTests.stdout.on("data", (data) => {
  if (data.includes("failing")) {
    integrationTestsFailed = true;
  }
  process.stdout.write(data);
});

integrationTests.stderr.on("data", (data) => {
  if (data.includes("failing")) {
    integrationTestsFailed = true;
  }
  process.stderr.write(data);
});

integrationTests.on("close", (code) => {
  if (integrationTestsFailed || code !== 0) {
    return process.exit(code);
  } else {
    process.exit(0);
  }
});
