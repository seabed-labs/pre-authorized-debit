const { spawn } = require("node:child_process");
const process = require("node:process");
const console = require("node:console");

const isParallel = process.env.TEST_MODE !== "debug";
const scope = process.argv[2] ? process.argv[2] : "**";
const testCommand = `yarn run ts-mocha -p ./tsconfig.json -t 1000000 ${
  isParallel ? "--parallel" : ""
} program-tests/${scope}/*.ts`;

console.log("Running:", testCommand);
const [command, ...args] = testCommand.split(" ");

spawn(command, args, {
  cwd: process.cwd(),
  detached: false,
  stdio: "inherit",
});
