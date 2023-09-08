use anchor_lang::prelude::*;

pub mod errors;
pub mod instructions;
pub mod state;

use instructions::*;

declare_id!("Debit3fDrmgHiJpc5rhxi1YjsWtbupdSLaCRE1Xk7fhT");

#[program]
pub mod pre_authorized_debit_v1 {
    use super::*;

    /**
    The `InitSmartDelegate` instruction will create a `smart_delegate` account.

    Initializes a new account (`smart_delegate`).
    The `token_account.delegate` is set to the newly created `smart_delegate` account.
    The `token_account.delegated_amount` is set to `u64::MAX`.
    The `token_account.owner` remains un-changed.
    The `smart_delegate` PDA is used by the `pre_authorized_debit` program to sign for
    valid pre-authorized debits to transfer funds from the token account.

    The `payer` MUST sign the transaction.
    The `payer` MUST have enough lamports to pay for the `smart_delegate` account.
    The `owner` MUST sign the transaction.
    The `owner` MUST be the `token_account.owner`.
    The `payer` and `owner` may be the same account.
    The `token_program` MUST be either the token program or token 22 program.

    Accounts expected by this instruction:
        0. `[writable]` payer
        1. `[]`         owner
        2. `[writable]` token_account
        3. `[writable]` smart_delegate
        4. `[]`         token_program
        5. `[]`         system_program
    */
    pub fn init_smart_delegate(ctx: Context<InitSmartDelegate>) -> Result<()> {
        handle_init_smart_delegate(ctx)
    }

    /**
    The `CloseSmartDelegate` instruction will create close a `smart_delegate` account.

    Closes an existing `smart_delegate` account.
    The token program `revoke` instruction will be called on the `token_account`.

    The `receiver` can be any account.
    The `owner` MUST sign the transaction.
    The `owner` MUST be the `token_account.owner`.
    The `receiver` and `owner` may be the same account.
    The `token_account.owner` MUST be the `owner`.
    The `smart_delegate.token_account` must be the same as `token_account`.
    The `token_program` MUST be either the token program or token 22 program.

    Accounts expected by this instruction:
        0. `[writable]` receiver: The receiver of the `smart_delegate` lamports.
        1. `[]`         owner
        2. `[writable]` token_account
        3. `[writable]` smart_delegate
        4. `[]`         token_program
    */
    pub fn close_smart_delegate(ctx: Context<CloseSmartDelegate>) -> Result<()> {
        handle_close_smart_delegate(ctx)
    }

    /**
    The `InitPreAuthorization` instruction will create a `pre_authorization` account.

    Initializes a new account (`pre_authorization`).
    The `pre_authorization` defines a set of rules.
    The `pre_authorization` rules/constraints are verified during a `debit` instruction.
    The `pre_authorization` in conjunction with a `smart_delegate` for the same `token_account`
    can allow the `pre_authorization.debit_authority` to do a one-time or recurring debit from the
    `token_account.
    For a pair of `debit_authority` and `token_account`, only a single `pre_authorization` account can exist.
    To create another `pre_authorization` for the same `token_account`, another `debit_authority` must be used.

    The `payer` MUST sign the transaction.
    The `payer` MUST have enough lamports to pay for the `pre_authorization` account.
    The `owner` MUST sign the transaction.
    The `owner` MUST be the `token_account.owner`.
    The `payer` and `owner` may be the same account.
    The `token_account.owner` MUST be the `owner`.
    The `pre_authorization.token_account` must be the same as `token_account`.

    Accounts expected by this instruction:
        0. `[writable]` payer
        1. `[]`         owner
        2. `[writable]` token_account
        3. `[writable]` pre_authorization
        4. `[]`         system_program
    */
    pub fn init_pre_authorization(
        ctx: Context<InitPreAuthorization>,
        params: InitPreAuthorizationParams,
    ) -> Result<()> {
        handle_init_pre_authorization(ctx, params)
    }

    /**
    The `ClosePreAuthorization` instruction will close a `pre_authorization` account.

    Closes an existing `pre_authorization` account and refunds the lamports
    to the `token_account.owner` (`receiver`).

    The `receiver` will receive all lamports from the closed account.
    The `receiver` MUST be the `token_account.owner`.
    The `authority` MUST sign for the instruction.
    The `authority` MUST be either the `token_account.owner` or the `pre_authorization.debit_authority`.
    The `owner` MUST be the `token_account.owner`.
    The `token_account.owner` MUST be the `owner`.
    The `pre_authorization.token_account` must be the same as `token_account`.

    Accounts expected by this instruction:
        0. `[writable]` receiver
        1. `[]`         authority
        2. `[]`         token_account
        3. `[writable]` pre_authorization
    */
    pub fn close_pre_authorization(ctx: Context<ClosePreAuthorization>) -> Result<()> {
        handle_close_pre_authorization(ctx)
    }

    /**
    The `Debit` instruction allows a `pre_authorization.debit_authority` to debit from the
    `pre_authorization.token_account` via the `smart_delegate` PDA. To successfully debit from
    the `token_account`, the constraints for the `pre_authorization` must be met.

    Definitions:
      - PA = pre_authorization

    Common Rules:
    - The `pre_authorization` MUST not be paused.
    - The amount being requested to debit must be less than or equal to the available amount for the current_cycle
    - The current timestamp must be less than the `PA.expiry_unix_timestamp`
    - If the PA has a `num_cycles` defined, the `current_cycle` must be less than or equal to `PA.num_cycles`

    For a recurring pre-authorization:
    - The debit_authority must not have already done a debit in the current cycle

    For a one-time pre-authorization:
    - the validator time must be greater than or equal to the `pre_authorization.activation_unix_timestamp`

    For a more in-depth understanding around the constraints in a debit, it is recomended to read through
    the validation done for a `debit` instruction.

    The `debit_authority` MUST sign the transaction.
    The `debit_authority` MUST equal the `pre_authorization.debit_authority`.
    The `mint` MUST equal `token_account.mint` and `destination_token_account.mint`.
    The `token_account.delegate` MUST equal the `smart_delegate`.
    The `token_account.mint` MUST equal the `mint`.
    The `destination_token_account.mint` MUST equal `mint`.
    The `smart_delegate.token_account` MUST equal `token_account`.
    The `pre_authorization.token_account` MUST equal the `token_account`.
    The `token_program` MUST equal the token program matching the `token_account`.

    Accounts expected by this instruction:
        0. `[]`         debit_authority
        1. `[]`         mint
        2. `[writable]` token_account
        3. `[writable]` destination_token_account
        4. `[]`         smart_delegate
        5. `[writable]` pre_authorization
        6. `[]`         token_program
    */
    pub fn debit(ctx: Context<Debit>, params: DebitParams) -> Result<()> {
        handle_debit(ctx, params)
    }

    /**
    The `UpdatePausePreAuthorization` instruction allows a `token_account.owner` to pause a
    `pre_authorization`.

    The `owner` MUST sign the transaction.
    The `owner` MUST equal the `token_account.owner`.
    The `token_account.owner` MUST equal the `owner`.
    The `pre_authorization.token_account` MUST equal the `token_account`.

    Accounts expected by this instruction:
        0. `[writable]` owner
        2. `[]`         token_account
        3. `[writable]` pre_authorization
    */
    pub fn update_pause_pre_authorization(
        ctx: Context<UpdatePausePreAuthorization>,
        params: UpdatePausePreAuthorizationParams,
    ) -> Result<()> {
        handle_update_pause_pre_authorization(ctx, params)
    }
}
