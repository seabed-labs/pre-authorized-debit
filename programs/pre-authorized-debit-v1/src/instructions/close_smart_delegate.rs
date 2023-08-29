use anchor_lang::prelude::*;
use anchor_spl::token_interface::{self, Revoke, TokenAccount, TokenInterface};

use crate::state::smart_delegate::SmartDelegate;

#[derive(Accounts)]
pub struct CloseSmartDelegate<'info> {
    /// CHECK: Can be any account
    #[account(mut)]
    pub receiver: AccountInfo<'info>,

    // Owner of the smart delegate's token account has to sign
    pub owner: Signer<'info>,

    // TODO: Throw custom error on failure
    #[account(has_one = owner)]
    pub token_account: InterfaceAccount<'info, TokenAccount>,

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

    pub token_program: Interface<'info, TokenInterface>,
}

pub fn handle_close_smart_delegate(ctx: Context<CloseSmartDelegate>) -> Result<()> {
    // idempotent
    token_interface::revoke(CpiContext::new(
        ctx.accounts.token_program.to_account_info(),
        Revoke {
            source: ctx.accounts.token_account.to_account_info(),
            authority: ctx.accounts.owner.to_account_info(),
        },
    ))?;

    Ok(())
}
