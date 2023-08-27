import { PreAuthorization } from "./PreAuthorization";
import { SmartDelegate } from "./SmartDelegate";

// This file was automatically generated. DO NOT MODIFY DIRECTLY.
export { PreAuthorization } from "./PreAuthorization";
export type {
  PreAuthorizationAccount,
  PreAuthorizationAccountJSON,
} from "./PreAuthorization";
export { SmartDelegate } from "./SmartDelegate";
export type {
  SmartDelegateAccount,
  SmartDelegateAccountJSON,
} from "./SmartDelegate";

export interface AccountHandler<T> {
  preAuthorizationAccountHandler(account: PreAuthorization): Promise<T>;
  smartDelegateAccountHandler(account: SmartDelegate): Promise<T>;
}

export async function processAccount<T>(
  accountData: Uint8Array,
  accountHandler: AccountHandler<T>
): Promise<T | undefined> {
  const accountDataBuff = Buffer.from(accountData);
  if (PreAuthorization.isDiscriminatorEqual(accountDataBuff)) {
    const decodedAccount = PreAuthorization.decode(accountDataBuff);
    return await accountHandler.preAuthorizationAccountHandler(decodedAccount);
  }
  if (SmartDelegate.isDiscriminatorEqual(accountDataBuff)) {
    const decodedAccount = SmartDelegate.decode(accountDataBuff);
    return await accountHandler.smartDelegateAccountHandler(decodedAccount);
  }
  return undefined;
}
