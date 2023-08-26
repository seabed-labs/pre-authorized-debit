import * as PreAuthorizationVariant from "./PreAuthorizationVariant";

// This file was automatically generated. DO NOT MODIFY DIRECTLY.
export { InitPreAuthorizationParams } from "./InitPreAuthorizationParams";
export type {
  InitPreAuthorizationParamsFields,
  InitPreAuthorizationParamsJSON,
} from "./InitPreAuthorizationParams";
export { PreAuthorizationVariant };

export type PreAuthorizationVariantKind =
  | PreAuthorizationVariant.OneTime
  | PreAuthorizationVariant.Recurring;
export type PreAuthorizationVariantJSON =
  | PreAuthorizationVariant.OneTimeJSON
  | PreAuthorizationVariant.RecurringJSON;
