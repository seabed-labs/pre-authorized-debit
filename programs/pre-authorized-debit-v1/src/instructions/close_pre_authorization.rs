use anchor_lang::prelude::*;
use anchor_spl::token::TokenAccount;

use crate::state::pre_authorization::PreAuthorization;

#[derive(Accounts)]
pub struct ClosePreAuthorization<'info> {
    /// CHECK: Verified manually
    #[account(
        mut,
        // TODO: Throw custom error on failure
        address = token_account.owner,
    )]
    pub receiver: AccountInfo<'info>,

    pub authority: Signer<'info>,

    pub token_account: Account<'info, TokenAccount>,

    #[account(
        mut,
        close = receiver,
        seeds = [
            b"pre-authorization",
            token_account.key().as_ref(),
            pre_authorization.debit_authority.as_ref(),
        ],
        bump = pre_authorization.bump,
        // TODO: Throw custom error on failure
        has_one = token_account,
    )]
    pub pre_authorization: Account<'info, PreAuthorization>,
}

pub fn handle_close_pre_authorization(_ctx: Context<ClosePreAuthorization>) -> Result<()> {
    Ok(())
}
