export default function teardown() {
  console.log("shutting down solana validator...");
  process.kill(globalThis.__INTEG_TEST_SERVER_PID__);
}
