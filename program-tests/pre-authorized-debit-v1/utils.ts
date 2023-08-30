import { AnchorProvider } from "@coral-xyz/anchor";
import { PublicKey, SystemProgram, Transaction } from "@solana/web3.js";

export async function fundAccounts(
  provider: AnchorProvider,
  addresses: PublicKey[],
  amount: number | bigint
): Promise<void> {
  const transfers = addresses.map((address) =>
    SystemProgram.transfer({
      fromPubkey: provider.publicKey,
      toPubkey: address,
      lamports: amount,
    })
  );
  const fundTx = new Transaction({
    feePayer: provider.publicKey,
    recentBlockhash: (await provider.connection.getRecentBlockhash()).blockhash,
  }).add(...transfers);

  await provider.sendAndConfirm(fundTx);
}

export function deriveSmartDelegate(
  tokenAccount: PublicKey,
  programId: PublicKey
): PublicKey {
  const [pdaPubkey] = PublicKey.findProgramAddressSync(
    [Buffer.from("smart-delegate"), tokenAccount.toBuffer()],
    programId
  );

  return pdaPubkey;
}
