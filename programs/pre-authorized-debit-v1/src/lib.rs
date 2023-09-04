use anchor_lang::prelude::*;

pub mod errors;
pub mod instructions;
pub mod state;

use instructions::*;

declare_id!("HjJXoCqUmn6VQzXLqA1pEvWRZZcEMbD2HGixXKrs7DQj");

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

    The `InitSmartDelegate` instruction requires the `payer` and `owner` to sign the transaction.
    The `owner` MUST be the `token_account.owner`.
    The `payer` and `owner` may be the same account.
    The `token_program` MUST be either the token program or token 22 program.
    The `system_program` MUST be the system program.

    Accounts expected by this instruction:
      0. `[writable]` payer: The payer for the `smart_delegate`.
      1. `[]`         owner: The new accounts owner.
      2. `[writable]` token_account: The `token_account` this `smart_delegate` will sign for as the `token_account.delegate`.
      3. `[writable]` smart_delegate: The `smart_delegate` is the new account being initialized.
      4. `[]`         token_program.
      5. `[]`         system_program.
    */
    pub fn init_smart_delegate(ctx: Context<InitSmartDelegate>) -> Result<()> {
        handle_init_smart_delegate(ctx)
    }

    /**
    The `CloseSmartDelegate` instruction will create close a `smart_delegate` account.

    Closes an existing `smart_delegate` account.
    The token program `revoke` instruction will be called on the `token_account`.

    The `CloseSmartDelegate` instruction requires the `owner` to sign the transaction.
    The `receiver` and `owner` may be the same account.
    The `owner` MUST be the `token_account.owner`.
    The `token_account.owner` MUST be the `owner`.
    The `smart_delegate.token_account` must be the same as `token_account`.
    The `token_program` MUST be either the token program or token 22 program.

    Accounts expected by this instruction:
      0. `[writable]` receiver: The receiver of the `smart_delegate` lamports.
      1. `[]`         owner: The `token_account.owner`.
      2. `[writable]` token_account: The `token_account` associated to the `smart_delegate` being closed.
      3. `[writable]` smart_delegate.
      4. `[]`         token_program.
    */
    pub fn close_smart_delegate(ctx: Context<CloseSmartDelegate>) -> Result<()> {
        handle_close_smart_delegate(ctx)
    }

    pub fn init_pre_authorization(
        ctx: Context<InitPreAuthorization>,
        params: InitPreAuthorizationParams,
    ) -> Result<()> {
        handle_init_pre_authorization(ctx, params)
    }

    pub fn close_pre_authorization(ctx: Context<ClosePreAuthorization>) -> Result<()> {
        handle_close_pre_authorization(ctx)
    }

    pub fn debit(ctx: Context<Debit>, params: DebitParams) -> Result<()> {
        handle_debit(ctx, params)
    }

    pub fn update_pause_pre_authorization(
        ctx: Context<UpdatePausePreAuthorization>,
        params: UpdatePausePreAuthorizationParams,
    ) -> Result<()> {
        handle_update_pause_pre_authorization(ctx, params)
    }
}
