use anchor_lang::prelude::*;
use anchor_spl::token::{self, Revoke, Token, TokenAccount};

use crate::state::smart_delegate::SmartDelegate;

#[derive(Accounts)]
pub struct CloseSmartDelegate<'info> {
    /// CHECK: Can be any account
    #[account(mut)]
    pub receiver: AccountInfo<'info>,

    pub owner: Signer<'info>,

    pub token_account: Account<'info, TokenAccount>,

    #[account(
        mut,
        close = receiver,
        seeds = [
            b"smart-delegate",
            token_account.key().as_ref(),
        ],
        bump = smart_delegate.bump,
        // TODO: Throw custom error on failure
        has_one = token_account,
    )]
    pub smart_delegate: Account<'info, SmartDelegate>,

    pub token_program: Program<'info, Token>,
}

pub fn handle_close_smart_delegate(ctx: Context<CloseSmartDelegate>) -> Result<()> {
    // idempotent
    token::revoke(CpiContext::new(
        ctx.accounts.token_program.to_account_info(),
        Revoke {
            source: ctx.accounts.token_account.to_account_info(),
            authority: ctx.accounts.owner.to_account_info(),
        },
    ))?;

    Ok(())
}
