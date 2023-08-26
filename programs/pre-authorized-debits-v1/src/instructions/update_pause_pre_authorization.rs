use anchor_lang::prelude::*;
use anchor_spl::token::TokenAccount;

use crate::state::{pre_authorization::PreAuthorization, smart_delegate::SmartDelegate};

#[derive(Accounts)]
pub struct UpdatePausePreAuthorization<'info> {
    pub owner: Signer<'info>,

    // TODO: Throw custom error on failure
    #[account(has_one = owner)]
    pub token_account: Account<'info, TokenAccount>,

    #[account(
        seeds = [
            b"smart-delegate",
            token_account.key().as_ref(),
        ],
        bump = smart_delegate.bump,
        // TODO: Throw custom error on failure
        has_one = token_account,
    )]
    pub smart_delegate: Account<'info, SmartDelegate>,

    #[account(
        mut,
        seeds = [
            b"pre-authorization",
            smart_delegate.key().as_ref(),
            pre_authorization.nonce.to_string().as_ref(),
        ],
        bump = pre_authorization.bump,
        // TODO: Throw custom error on failure
        has_one = smart_delegate,
    )]
    pub pre_authorization: Account<'info, PreAuthorization>,
}

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct UpdatePausePreAuthorizationParams {
    pub pause: bool,
}

pub fn handle_update_pause_pre_authorization(
    ctx: Context<UpdatePausePreAuthorization>,
    params: UpdatePausePreAuthorizationParams,
) -> Result<()> {
    ctx.accounts.pre_authorization.paused = params.pause;

    Ok(())
}
