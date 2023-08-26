// This file was automatically generated. DO NOT MODIFY DIRECTLY.
import { PublicKey } from "@solana/web3.js";
import { InitSmartAccountNonce } from "./initSmartAccountNonce";
import { InitSmartAccount } from "./initSmartAccount";
import { InitOneTimePreAuthorization } from "./initOneTimePreAuthorization";
import { CancelPreAuthorization } from "./cancelPreAuthorization";
import { DebitAsAuthority } from "./debitAsAuthority";
import { DebitAgainstPad } from "./debitAgainstPad";
import { StartVirtualDebitAsAuthority } from "./startVirtualDebitAsAuthority";
import { CompleteVirtualDebitAsAuthority } from "./completeVirtualDebitAsAuthority";
import { StartVirtualDebitAgainstPad } from "./startVirtualDebitAgainstPad";
import { CompleteVirtualDebitAgainstPad } from "./completeVirtualDebitAgainstPad";

export * from "./initSmartAccountNonce";
export type { InitSmartAccountNonceAccounts } from "./initSmartAccountNonce";
export * from "./initSmartAccount";
export type { InitSmartAccountAccounts } from "./initSmartAccount";
export * from "./initOneTimePreAuthorization";
export type {
  InitOneTimePreAuthorizationArgs,
  InitOneTimePreAuthorizationAccounts,
} from "./initOneTimePreAuthorization";
export * from "./cancelPreAuthorization";
export type { CancelPreAuthorizationAccounts } from "./cancelPreAuthorization";
export * from "./debitAsAuthority";
export type { DebitAsAuthorityAccounts } from "./debitAsAuthority";
export * from "./debitAgainstPad";
export type { DebitAgainstPadAccounts } from "./debitAgainstPad";
export * from "./startVirtualDebitAsAuthority";
export type { StartVirtualDebitAsAuthorityAccounts } from "./startVirtualDebitAsAuthority";
export * from "./completeVirtualDebitAsAuthority";
export type { CompleteVirtualDebitAsAuthorityAccounts } from "./completeVirtualDebitAsAuthority";
export * from "./startVirtualDebitAgainstPad";
export type { StartVirtualDebitAgainstPadAccounts } from "./startVirtualDebitAgainstPad";
export * from "./completeVirtualDebitAgainstPad";
export type { CompleteVirtualDebitAgainstPadAccounts } from "./completeVirtualDebitAgainstPad";

export enum SmartAccountV1InstructionNames {
  initSmartAccountNonce = "initSmartAccountNonce",
  initSmartAccount = "initSmartAccount",
  initOneTimePreAuthorization = "initOneTimePreAuthorization",
  cancelPreAuthorization = "cancelPreAuthorization",
  debitAsAuthority = "debitAsAuthority",
  debitAgainstPad = "debitAgainstPad",
  startVirtualDebitAsAuthority = "startVirtualDebitAsAuthority",
  completeVirtualDebitAsAuthority = "completeVirtualDebitAsAuthority",
  startVirtualDebitAgainstPad = "startVirtualDebitAgainstPad",
  completeVirtualDebitAgainstPad = "completeVirtualDebitAgainstPad",
}

export interface InstructionHandler<T> {
  initSmartAccountNonceIxHandler(ix: InitSmartAccountNonce): Promise<T>;
  initSmartAccountIxHandler(ix: InitSmartAccount): Promise<T>;
  initOneTimePreAuthorizationIxHandler(
    ix: InitOneTimePreAuthorization
  ): Promise<T>;
  cancelPreAuthorizationIxHandler(ix: CancelPreAuthorization): Promise<T>;
  debitAsAuthorityIxHandler(ix: DebitAsAuthority): Promise<T>;
  debitAgainstPadIxHandler(ix: DebitAgainstPad): Promise<T>;
  startVirtualDebitAsAuthorityIxHandler(
    ix: StartVirtualDebitAsAuthority
  ): Promise<T>;
  completeVirtualDebitAsAuthorityIxHandler(
    ix: CompleteVirtualDebitAsAuthority
  ): Promise<T>;
  startVirtualDebitAgainstPadIxHandler(
    ix: StartVirtualDebitAgainstPad
  ): Promise<T>;
  completeVirtualDebitAgainstPadIxHandler(
    ix: CompleteVirtualDebitAgainstPad
  ): Promise<T>;
}

export async function processInstruction<T>(
  programId: PublicKey,
  ixData: Uint8Array,
  accounts: PublicKey[],
  instructionHandler: InstructionHandler<T>
): Promise<T | undefined> {
  const ixDataBuff = Buffer.from(ixData);
  if (InitSmartAccountNonce.isIdentifierEqual(ixDataBuff)) {
    const decodedIx = InitSmartAccountNonce.decode(programId, accounts);
    return await instructionHandler.initSmartAccountNonceIxHandler(decodedIx);
  }
  if (InitSmartAccount.isIdentifierEqual(ixDataBuff)) {
    const decodedIx = InitSmartAccount.decode(programId, accounts);
    return await instructionHandler.initSmartAccountIxHandler(decodedIx);
  }
  if (InitOneTimePreAuthorization.isIdentifierEqual(ixDataBuff)) {
    const decodedIx = InitOneTimePreAuthorization.decode(
      programId,
      ixDataBuff,
      accounts
    );
    return await instructionHandler.initOneTimePreAuthorizationIxHandler(
      decodedIx
    );
  }
  if (CancelPreAuthorization.isIdentifierEqual(ixDataBuff)) {
    const decodedIx = CancelPreAuthorization.decode(programId, accounts);
    return await instructionHandler.cancelPreAuthorizationIxHandler(decodedIx);
  }
  if (DebitAsAuthority.isIdentifierEqual(ixDataBuff)) {
    const decodedIx = DebitAsAuthority.decode(programId, accounts);
    return await instructionHandler.debitAsAuthorityIxHandler(decodedIx);
  }
  if (DebitAgainstPad.isIdentifierEqual(ixDataBuff)) {
    const decodedIx = DebitAgainstPad.decode(programId, accounts);
    return await instructionHandler.debitAgainstPadIxHandler(decodedIx);
  }
  if (StartVirtualDebitAsAuthority.isIdentifierEqual(ixDataBuff)) {
    const decodedIx = StartVirtualDebitAsAuthority.decode(programId, accounts);
    return await instructionHandler.startVirtualDebitAsAuthorityIxHandler(
      decodedIx
    );
  }
  if (CompleteVirtualDebitAsAuthority.isIdentifierEqual(ixDataBuff)) {
    const decodedIx = CompleteVirtualDebitAsAuthority.decode(
      programId,
      accounts
    );
    return await instructionHandler.completeVirtualDebitAsAuthorityIxHandler(
      decodedIx
    );
  }
  if (StartVirtualDebitAgainstPad.isIdentifierEqual(ixDataBuff)) {
    const decodedIx = StartVirtualDebitAgainstPad.decode(programId, accounts);
    return await instructionHandler.startVirtualDebitAgainstPadIxHandler(
      decodedIx
    );
  }
  if (CompleteVirtualDebitAgainstPad.isIdentifierEqual(ixDataBuff)) {
    const decodedIx = CompleteVirtualDebitAgainstPad.decode(
      programId,
      accounts
    );
    return await instructionHandler.completeVirtualDebitAgainstPadIxHandler(
      decodedIx
    );
  }
  return undefined;
}
