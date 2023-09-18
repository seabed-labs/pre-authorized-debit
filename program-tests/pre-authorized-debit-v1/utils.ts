import { Event, Program } from "@coral-xyz/anchor";
import { MAX_SEED_LENGTH, PublicKey } from "@solana/web3.js";
import { sha256 } from "@noble/hashes/sha256";
import { PreAuthorizedDebitV1 } from "../../target/types/pre_authorized_debit_v1";

/**
 * Derives the canonical public key for the pre authorization
 * @param tokenAccount
 * @param debitAuthority
 * @param programId
 */
export function derivePreAuthorization(
  tokenAccount: PublicKey,
  debitAuthority: PublicKey,
  programId: PublicKey,
): [PublicKey, number] {
  const [pdaPubkey, pdaBump] = PublicKey.findProgramAddressSync(
    [
      Buffer.from("pre-authorization"),
      tokenAccount.toBuffer(),
      debitAuthority.toBuffer(),
    ],
    programId,
  );
  return [pdaPubkey, pdaBump];
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
  programId: PublicKey,
): PublicKey {
  const [pdaPubkey] = deriveNthPda(
    [
      Buffer.from("pre-authorization"),
      tokenAccount.toBuffer(),
      debitAuthority.toBuffer(),
    ],
    programId,
    3,
  );

  return pdaPubkey;
}

/**
 * Derives the non-canonical public key for the smart-delegate
 * @param programId
 * @returns
 */
export function deriveInvalidSmartDelegate(programId: PublicKey): PublicKey {
  const [pdaPubkey] = deriveNthPda(
    [Buffer.from("smart-delegate")],
    programId,
    3,
  );

  return pdaPubkey;
}

function deriveNthPda(
  seeds: Array<Buffer | Uint8Array>,
  programId: PublicKey,
  n: number,
): [PublicKey, number] {
  let nonce = 255;
  let numFound = 0;
  while (nonce !== 0) {
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

/// ////////////////////////////
// The functions below where copied from solana web3.js
/// ////////////////////////////

function createProgramAddressSync(
  seeds: Array<Buffer | Uint8Array>,
  programId: PublicKey,
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

export function getCurrentUnixTimestamp(): number {
  return Math.floor(new Date().getTime() / 1e3);
}

export type DebitEvent = Event<
  Program<PreAuthorizedDebitV1>["idl"]["events"]["2"]
>;

export const U64_MAX = (BigInt(2) ** BigInt(64) - BigInt(1)).toString();

export enum PreAuthTestVariant {
  OneTime = "one-time",
  Recurring = "recurring",
}
