import { PreAuthorization } from "./PreAuthorization";
import { SmartAccountNonce } from "./SmartAccountNonce";
import { SmartAccount } from "./SmartAccount";

// This file was automatically generated. DO NOT MODIFY DIRECTLY.
export { PreAuthorization } from "./PreAuthorization";
export type {
  PreAuthorizationAccount,
  PreAuthorizationAccountJSON,
} from "./PreAuthorization";
export { SmartAccountNonce } from "./SmartAccountNonce";
export type {
  SmartAccountNonceAccount,
  SmartAccountNonceAccountJSON,
} from "./SmartAccountNonce";
export { SmartAccount } from "./SmartAccount";
export type {
  SmartAccountAccount,
  SmartAccountAccountJSON,
} from "./SmartAccount";

export interface AccountHandler<T> {
  preAuthorizationAccountHandler(account: PreAuthorization): Promise<T>;
  smartAccountNonceAccountHandler(account: SmartAccountNonce): Promise<T>;
  smartAccountAccountHandler(account: SmartAccount): Promise<T>;
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
  if (SmartAccountNonce.isDiscriminatorEqual(accountDataBuff)) {
    const decodedAccount = SmartAccountNonce.decode(accountDataBuff);
    return await accountHandler.smartAccountNonceAccountHandler(decodedAccount);
  }
  if (SmartAccount.isDiscriminatorEqual(accountDataBuff)) {
    const decodedAccount = SmartAccount.decode(accountDataBuff);
    return await accountHandler.smartAccountAccountHandler(decodedAccount);
  }
  return undefined;
}
