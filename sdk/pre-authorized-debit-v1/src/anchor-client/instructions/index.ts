// This file was automatically generated. DO NOT MODIFY DIRECTLY.
import { PublicKey } from "@solana/web3.js";
import { InitSmartDelegate } from "./initSmartDelegate";
import { CloseSmartDelegate } from "./closeSmartDelegate";
import { InitPreAuthorization } from "./initPreAuthorization";
import { ClosePreAuthorization } from "./closePreAuthorization";
import { Debit } from "./debit";
import { UpdatePausePreAuthorization } from "./updatePausePreAuthorization";

export * from "./initSmartDelegate";
export type { InitSmartDelegateAccounts } from "./initSmartDelegate";
export * from "./closeSmartDelegate";
export type { CloseSmartDelegateAccounts } from "./closeSmartDelegate";
export * from "./initPreAuthorization";
export type {
  InitPreAuthorizationArgs,
  InitPreAuthorizationAccounts,
} from "./initPreAuthorization";
export * from "./closePreAuthorization";
export type { ClosePreAuthorizationAccounts } from "./closePreAuthorization";
export * from "./debit";
export type { DebitArgs, DebitAccounts } from "./debit";
export * from "./updatePausePreAuthorization";
export type {
  UpdatePausePreAuthorizationArgs,
  UpdatePausePreAuthorizationAccounts,
} from "./updatePausePreAuthorization";

export enum PreAuthorizedDebitV1InstructionNames {
  initSmartDelegate = "initSmartDelegate",
  closeSmartDelegate = "closeSmartDelegate",
  initPreAuthorization = "initPreAuthorization",
  closePreAuthorization = "closePreAuthorization",
  debit = "debit",
  updatePausePreAuthorization = "updatePausePreAuthorization",
}

export interface InstructionHandler<T> {
  initSmartDelegateIxHandler(ix: InitSmartDelegate): Promise<T>;
  closeSmartDelegateIxHandler(ix: CloseSmartDelegate): Promise<T>;
  initPreAuthorizationIxHandler(ix: InitPreAuthorization): Promise<T>;
  closePreAuthorizationIxHandler(ix: ClosePreAuthorization): Promise<T>;
  debitIxHandler(ix: Debit): Promise<T>;
  updatePausePreAuthorizationIxHandler(
    ix: UpdatePausePreAuthorization
  ): Promise<T>;
}

export async function processInstruction<T>(
  programId: PublicKey,
  ixData: Uint8Array,
  accounts: PublicKey[],
  instructionHandler: InstructionHandler<T>
): Promise<T | undefined> {
  const ixDataBuff = Buffer.from(ixData);
  if (InitSmartDelegate.isIdentifierEqual(ixDataBuff)) {
    const decodedIx = InitSmartDelegate.decode(programId, accounts);
    return await instructionHandler.initSmartDelegateIxHandler(decodedIx);
  }
  if (CloseSmartDelegate.isIdentifierEqual(ixDataBuff)) {
    const decodedIx = CloseSmartDelegate.decode(programId, accounts);
    return await instructionHandler.closeSmartDelegateIxHandler(decodedIx);
  }
  if (InitPreAuthorization.isIdentifierEqual(ixDataBuff)) {
    const decodedIx = InitPreAuthorization.decode(
      programId,
      ixDataBuff,
      accounts
    );
    return await instructionHandler.initPreAuthorizationIxHandler(decodedIx);
  }
  if (ClosePreAuthorization.isIdentifierEqual(ixDataBuff)) {
    const decodedIx = ClosePreAuthorization.decode(programId, accounts);
    return await instructionHandler.closePreAuthorizationIxHandler(decodedIx);
  }
  if (Debit.isIdentifierEqual(ixDataBuff)) {
    const decodedIx = Debit.decode(programId, ixDataBuff, accounts);
    return await instructionHandler.debitIxHandler(decodedIx);
  }
  if (UpdatePausePreAuthorization.isIdentifierEqual(ixDataBuff)) {
    const decodedIx = UpdatePausePreAuthorization.decode(
      programId,
      ixDataBuff,
      accounts
    );
    return await instructionHandler.updatePausePreAuthorizationIxHandler(
      decodedIx
    );
  }
  return undefined;
}
