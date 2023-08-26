use anchor_lang::prelude::*;

pub mod errors;
pub mod instructions;
pub mod state;

use instructions::*;

// TODO: Investigate how difficult it is to support Token 2022 (and decide whether it should be v2 or in this)
//       Seems like there is an `Interface<'info, ...>` type in anchor and ways to verify the token program
//       Look more into this

declare_id!("HjJXoCqUmn6VQzXLqA1pEvWRZZcEMbD2HGixXKrs7DQj");

#[program]
pub mod pre_authorized_debits_v1 {
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
}
