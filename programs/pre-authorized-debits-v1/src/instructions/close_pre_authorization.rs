use anchor_lang::prelude::*;
use anchor_spl::token::TokenAccount;

use crate::state::{pre_authorization::PreAuthorization, smart_delegate::SmartDelegate};

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
        seeds = [
            b"smart-delegate",
            token_account.key().as_ref(),
        ],
        bump = smart_delegate.bump,
        // TODO: Throw custom error on failure
        has_one = token_account,
        // TODO: Throw custom error on failure
        constraint = authority.key.eq(&token_account.owner) || authority.key.eq(&pre_authorization.debit_authority)
    )]
    pub smart_delegate: Account<'info, SmartDelegate>,

    #[account(
        mut,
        close = receiver,
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

pub fn handle_close_pre_authorization(_ctx: Context<ClosePreAuthorization>) -> Result<()> {
    Ok(())
}
