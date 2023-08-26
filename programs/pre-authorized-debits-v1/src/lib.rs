use anchor_lang::prelude::*;

pub mod instructions;
pub mod state;

use instructions::*;

// TODO: Investigate how difficult it is to support Token 2022 (and decide whether it should be v2 or in this)

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
}
