import { spawn } from 'node:child_process';
import process from 'node:process';
import console from 'node:console';

const isParallel = process.env.TEST_MODE !== 'debug';
const scope = process.argv[2] ? process.argv[2] : '**';
const testCommand =
  `yarn run ts-mocha -p ./tsconfig.json -t 1000000 ${isParallel ? '--parallel' : ''} program-tests/${scope}/*.ts`;

console.log('Running:', testCommand);
const [command, ...args] = testCommand.split(' ');

spawn(command, args, {
  cwd: process.cwd(),
  detached: false,
  stdio: 'inherit',
});
