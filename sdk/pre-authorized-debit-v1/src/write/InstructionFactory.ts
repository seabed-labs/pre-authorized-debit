import { InstructionWithData } from "./shared";
import {
  ApproveSmartDelegateParams,
  ApproveSmartDelegateResult,
  ClosePreAuthorizationAsDebitAuthorityParams,
  ClosePreAuthorizationAsDebitAuthorityResult,
  ClosePreAuthorizationAsOwnerParams,
  ClosePreAuthorizationAsOwnerResult,
  DebitResult,
  InitOneTimePreAuthorizationParams,
  InitOneTimePreAuthorizationResult,
  InitRecurringPreAuthorizationParams,
  InitRecurringPreAuthorizationResult,
  InitSmartDelegateParams,
  InitSmartDelegateResult,
  PausePreAuthorizationParams,
  PausePreAuthorizationResult,
  UnpausePreAuthorizationParams,
  UnpausePreAuthorizationResult,
} from "./params";
import { DebitParams } from "../anchor-client";

type IxFactoryFn<Params, Result> = (
  params: Params,
) => Promise<InstructionWithData<Result>>;

export interface InstructionFactory {
  buildInitSmartDelegateIx: IxFactoryFn<
    InitSmartDelegateParams,
    InitSmartDelegateResult
  >;

  buildInitOneTimePreAuthorizationIx: IxFactoryFn<
    InitOneTimePreAuthorizationParams,
    InitOneTimePreAuthorizationResult
  >;

  buildInitRecurringPreAuthorizationIx: IxFactoryFn<
    InitRecurringPreAuthorizationParams,
    InitRecurringPreAuthorizationResult
  >;

  buildPausePreAuthorizationIx: IxFactoryFn<
    PausePreAuthorizationParams,
    PausePreAuthorizationResult
  >;

  buildUnpausePreAuthorizationIx: IxFactoryFn<
    UnpausePreAuthorizationParams,
    UnpausePreAuthorizationResult
  >;

  buildClosePreAuthorizationAsOwnerIx: IxFactoryFn<
    ClosePreAuthorizationAsOwnerParams,
    ClosePreAuthorizationAsOwnerResult
  >;

  buildClosePreAuthorizationAsDebitAuthorityIx: IxFactoryFn<
    ClosePreAuthorizationAsDebitAuthorityParams,
    ClosePreAuthorizationAsDebitAuthorityResult
  >;

  buildDebitIx: IxFactoryFn<DebitParams, DebitResult>;

  // sets delegate to smartDelegate and amount to u64::max
  buildApproveSmartDelegateIx: IxFactoryFn<
    ApproveSmartDelegateParams,
    ApproveSmartDelegateResult
  >;
}
