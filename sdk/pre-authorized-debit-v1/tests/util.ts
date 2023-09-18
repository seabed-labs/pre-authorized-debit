import { Program } from "@coral-xyz/anchor";
import { Keypair, PublicKey, SystemProgram } from "@solana/web3.js";
import { deriveSmartDelegate } from "@dcaf/pad-integration-tests/utils";
import { PreAuthorizedDebitV1 } from "../src";
import NodeWallet from "@coral-xyz/anchor/dist/cjs/nodewallet";
import providerKeypair from "./fixtures/provider-keypair.json";

export function getProviderNodeWallet(): NodeWallet {
  const secretKey = Uint8Array.from(providerKeypair);
  const walletKeypair = Keypair.fromSecretKey(secretKey);
  return new NodeWallet(walletKeypair);
}

export async function initSmartDelegateIdempotent(
  program: Program<PreAuthorizedDebitV1>,
): Promise<PublicKey> {
  const [smartDelegate] = deriveSmartDelegate(program.programId);
  const accountInfo =
    await program.provider.connection.getAccountInfo(smartDelegate);
  if (accountInfo !== null) {
    return smartDelegate;
  }
  await program.methods
    .initSmartDelegate()
    .accounts({
      payer: program.provider.publicKey,
      smartDelegate,
      systemProgram: SystemProgram.programId,
    })
    .rpc();
  return smartDelegate;
}
