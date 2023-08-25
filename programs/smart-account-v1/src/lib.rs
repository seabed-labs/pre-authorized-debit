pub mod instructions;
pub mod state;

use instructions::*;

use anchor_lang::prelude::*;

declare_id!("3FWaGq3zYcqJq2t4tszrTAwVrLTc1BcAZzVGLAbK7piR");

#[program]
pub mod smart_account_v1 {
    use super::*;

    pub fn init_smart_account_nonce(ctx: Context<InitSmartAccountNonce>) -> Result<()> {
        handle_init_smart_account_nonce(ctx)
    }

    pub fn init_smart_account(ctx: Context<InitSmartAccount>) -> Result<()> {
        handle_init_smart_account(ctx)
    }

    pub fn init_one_time_pre_authorization(
        ctx: Context<InitPreAuthorization>,
        params: InitPreAuthorizationParams,
    ) -> Result<()> {
        handle_init_one_time_pre_authorization(ctx, params)
    }

    pub fn cancel_pre_authorization(ctx: Context<CancelPreAuthorization>) -> Result<()> {
        handle_cancel_pre_authorization(ctx)
    }

    pub fn debit_as_authority(_ctx: Context<DebitAsAuthority>) -> Result<()> {
        Ok(())
    }

    pub fn debit_against_pad(_ctx: Context<DebitAgainstPad>) -> Result<()> {
        Ok(())
    }

    pub fn start_virtual_debit_as_authority(
        _ctx: Context<StartVirtualDebitAsAuthority>,
    ) -> Result<()> {
        Ok(())
    }

    pub fn complete_virtual_debit_as_authority(
        _ctx: Context<CompleteVirtualDebitAsAuthority>,
    ) -> Result<()> {
        Ok(())
    }

    pub fn start_virtual_debit_against_pad(
        _ctx: Context<StartVirtualDebitAgainstPad>,
    ) -> Result<()> {
        Ok(())
    }

    pub fn complete_virtual_debit_against_pad(
        _ctx: Context<CompleteVirtualDebitAgainstPad>,
    ) -> Result<()> {
        Ok(())
    }
}
