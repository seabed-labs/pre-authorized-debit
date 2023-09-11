const { spawn } = require("node:child_process");
const process = require("node:process");
const console = require("node:console");

let integrationTestsFailed = false;
const isParallel = process.env.TEST_MODE !== "debug";

const scope = process.argv[2] ? process.argv[2] : "**";
// init_smart_delegate must be isolated to its own anchor test due to it creating a global account
const testSuffix = process.argv[3] ? process.argv[3] : ".ts";
// only retry on default test runs, not for the isolated tests in .2.ts
const shouldRetry = testSuffix === ".ts";
const testCommand = `yarn run ts-mocha -p ./tsconfig.json -t 1000000 ${
  isParallel ? "--parallel" : ""
} ${
  shouldRetry ? "--retries 2 " : ""
}program-tests/${scope}/*.test${testSuffix}`;

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
    process.exit(code);
  } else {
    process.exit(0);
  }
});
