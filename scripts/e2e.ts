import { PreAuthorizedDebitReadClientImpl } from "@seabed-labs/pre-authorized-debit";
import { Connection, clusterApiUrl } from "@solana/web3.js";

export async function e2e() {
  const connection = new Connection(clusterApiUrl("devnet"));
  const readClient = PreAuthorizedDebitReadClientImpl.devnet(connection);
  const smartDelegate = await readClient.fetchSmartDelegate();
  console.log(
    "Smart Delegate account:",
    JSON.stringify(smartDelegate, null, 2),
  );
}

if (require.main === module) {
  e2e();
}
