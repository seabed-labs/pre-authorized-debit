import { AnchorProvider } from "@coral-xyz/anchor";
import {
  Connection,
  MAX_SEED_LENGTH,
  PublicKey,
  SystemProgram,
  Transaction,
  VersionedTransactionResponse,
} from "@solana/web3.js";
import { sha256 } from "@noble/hashes/sha256";
import { assert } from "chai";

export async function waitForTxToConfirm(
  signature: string,
  connection: Connection
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
    "confirmed"
  );
  const tx = await connection.getTransaction(signature, {
    commitment: "confirmed",
    maxSupportedTransactionVersion: 0,
  });
  assert(tx);
  return tx;
}

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

  await provider.sendAndConfirm(fundTx, [], { commitment: "confirmed" });
}

/**
 * Derives the canonical public key for the pre authorization
 * @param tokenAccount
 * @param debitAuthority
 * @param programId
 */
export function derivePreAuthorization(
  tokenAccount: PublicKey,
  debitAuthority: PublicKey,
  programId: PublicKey
): PublicKey {
  const [pdaPubkey] = PublicKey.findProgramAddressSync(
    [
      Buffer.from("pre-authorization"),
      tokenAccount.toBuffer(),
      debitAuthority.toBuffer(),
    ],
    programId
  );
  return pdaPubkey;
}

/**
 * Derives the non-canonical public key for the pre-authorization
 * @param tokenAccount
 * @param debitAuthority
 * @param programId
 * @returns
 */
export function deriveInvalidPreAuthorization(
  tokenAccount: PublicKey,
  debitAuthority: PublicKey,
  programId: PublicKey
): PublicKey {
  const [pdaPubkey] = deriveNthPda(
    [
      Buffer.from("pre-authorization"),
      tokenAccount.toBuffer(),
      debitAuthority.toBuffer(),
    ],
    programId,
    3
  );

  return pdaPubkey;
}

/**
 * Derives the canonical public key for the smart-delegate
 * @param tokenAccount
 * @param programId
 * @returns
 */
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

/**
 * Derives the non-canonical public key for the smart-delegate
 * @param tokenAccount
 * @param programId
 * @returns
 */
export function deriveInvalidSmartDelegate(
  tokenAccount: PublicKey,
  programId: PublicKey
): PublicKey {
  const [pdaPubkey] = deriveNthPda(
    [Buffer.from("smart-delegate"), tokenAccount.toBuffer()],
    programId,
    3
  );

  return pdaPubkey;
}

function deriveNthPda(
  seeds: Array<Buffer | Uint8Array>,
  programId: PublicKey,
  n: number
): [PublicKey, number] {
  let nonce = 255;
  let numFound = 0;
  while (nonce != 0) {
    try {
      const seedsWithNonce = seeds.concat(Buffer.from([nonce]));
      const address = createProgramAddressSync(seedsWithNonce, programId);
      numFound = numFound + 1;
      if (n === numFound) {
        return [address, nonce];
      }
    } catch (err) {
      if (err instanceof TypeError) {
        throw err;
      }
    }
    nonce--;
    continue;
  }
  throw new Error(`Unable to find a viable program address nonce`);
}

///////////////////////////////
// The functions below where copied from solana web3.js
///////////////////////////////

function createProgramAddressSync(
  seeds: Array<Buffer | Uint8Array>,
  programId: PublicKey
): PublicKey {
  let buffer = Buffer.alloc(0);
  seeds.forEach(function (seed) {
    if (seed.length > MAX_SEED_LENGTH) {
      throw new TypeError(`Max seed length exceeded`);
    }
    buffer = Buffer.concat([buffer, toBuffer(seed)]);
  });
  buffer = Buffer.concat([
    buffer,
    programId.toBuffer(),
    Buffer.from("ProgramDerivedAddress"),
  ]);
  const publicKeyBytes = sha256(buffer);
  if (PublicKey.isOnCurve(publicKeyBytes)) {
    throw new Error(`Invalid seeds, address must fall off the curve`);
  }
  return new PublicKey(publicKeyBytes);
}

export const toBuffer = (arr: Buffer | Uint8Array | Array<number>): Buffer => {
  if (Buffer.isBuffer(arr)) {
    return arr;
  } else if (arr instanceof Uint8Array) {
    return Buffer.from(arr.buffer, arr.byteOffset, arr.byteLength);
  } else {
    return Buffer.from(arr);
  }
};
