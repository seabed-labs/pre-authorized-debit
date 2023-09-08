const { spawn } = require("node:child_process");
const process = require("node:process");
const console = require("node:console");

const isParallel = process.env.TEST_MODE !== "debug";
const scope = process.argv[2] ? process.argv[2] : "**";
const testCommand = `yarn run ts-mocha -p ./tsconfig.json -t 1000000 ${
  isParallel ? "--parallel" : ""
} --retries 2 program-tests/${scope}/*.test.ts`;

console.log("Running:", testCommand);
const [command, ...args] = testCommand.split(" ");

let testsFailed = false;

const tests = spawn(command, args, {
  cwd: process.cwd(),
  shell: true,
  detached: false,
  env: {
    ...process.env,
    FORCE_COLOR: true,
  },
});

tests.stdout.on("data", (data) => {
  if (data.includes("failing")) {
    testsFailed = true;
  }
  process.stdout.write(data);
});

tests.stderr.on("data", (data) => {
  if (data.includes("failing")) {
    testsFailed = true;
  }
  process.stderr.write(data);
});

tests.on("close", (code) => {
  if (testsFailed || code !== 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
});
