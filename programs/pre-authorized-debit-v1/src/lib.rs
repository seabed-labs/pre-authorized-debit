use anchor_lang::prelude::*;

pub mod errors;
pub mod instructions;
pub mod state;

use instructions::*;

declare_id!("HjJXoCqUmn6VQzXLqA1pEvWRZZcEMbD2HGixXKrs7DQj");

#[program]
pub mod pre_authorized_debit_v1 {
    use super::*;

    pub fn init_smart_delegate(ctx: Context<InitSmartDelegate>) -> Result<()> {
        handle_init_smart_delegate(ctx)
    }

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
