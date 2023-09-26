import { AnchorProvider, Program } from "@coral-xyz/anchor";
import {
  Connection,
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionConfirmationStrategy,
  VersionedTransactionResponse,
} from "@solana/web3.js";
import { assert } from "chai";
import { PreAuthorizedDebitV1 } from "./pre_authorized_debit_v1.ts";

export async function waitForTxToConfirm(
  signature: string,
  connection: Connection,
): Promise<VersionedTransactionResponse> {
  const blockhashContext = await connection.getLatestBlockhashAndContext({
    commitment: "confirmed",
  });
  await connection.confirmTransaction(
    {
      signature,
      lastValidBlockHeight: blockhashContext.value.lastValidBlockHeight,
      blockhash: blockhashContext.value.blockhash,
    },
    "confirmed",
  );
  const tx = await connection.getTransaction(signature, {
    commitment: "confirmed",
    maxSupportedTransactionVersion: 0,
  });
  assert(tx);
  return tx;
}

/**
 * Derives the canonical public key for the smart-delegate
 * @param programId
 * @returns [PDA Pubkey, PDA Bump]
 */
export function deriveSmartDelegate(programId: PublicKey): [PublicKey, number] {
  const [pdaPubkey, pdaBump] = PublicKey.findProgramAddressSync(
    [Buffer.from("smart-delegate")],
    programId,
  );
  return [pdaPubkey, pdaBump];
}

export async function initSmartDelegateIdempotent(
  program: Program<PreAuthorizedDebitV1>,
  provider: AnchorProvider,
): Promise<PublicKey> {
  const [smartDelegate] = deriveSmartDelegate(program.programId);
  const accountInfo = await provider.connection.getAccountInfo(smartDelegate);
  if (accountInfo !== null) {
    return smartDelegate;
  }
  await program.methods
    .initSmartDelegate()
    .accounts({
      payer: provider.publicKey,
      smartDelegate,
      systemProgram: SystemProgram.programId,
    })
    .rpc();
  return smartDelegate;
}

export async function fundAccounts(
  provider: AnchorProvider,
  addresses: PublicKey[],
  amount: number | bigint,
): Promise<TransactionConfirmationStrategy> {
  const transfers = addresses.map((address) =>
    SystemProgram.transfer({
      fromPubkey: provider.publicKey,
      toPubkey: address,
      lamports: amount,
    }),
  );

  const blockhashInfo = await provider.connection.getLatestBlockhash();
  const fundTx = new Transaction({ ...blockhashInfo });
  fundTx.add(...transfers);

  const txSig = await provider.sendAndConfirm(fundTx, []);
  return { signature: txSig, ...blockhashInfo };
}
