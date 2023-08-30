use anchor_lang::prelude::*;
use anchor_spl::token_interface::{self, Revoke, TokenAccount, TokenInterface};

use crate::{errors::CustomProgramError, state::smart_delegate::SmartDelegate};

#[derive(Accounts)]
pub struct CloseSmartDelegate<'info> {
    /// CHECK: Can be any account
    #[account(mut)]
    pub receiver: AccountInfo<'info>,

    // Owner of the smart delegate's token account has to sign (checked below)
    pub owner: Signer<'info>,

    #[account(
        has_one = owner @ CustomProgramError::SmartDelegateCloseUnauthorized
    )]
    pub token_account: InterfaceAccount<'info, TokenAccount>,

    #[account(
        mut,
        close = receiver,
        seeds = [
            b"smart-delegate",
            token_account.key().as_ref(),
        ],
        bump = smart_delegate.bump,
        has_one = token_account @ CustomProgramError::SmartDelegateTokenAccountMismatch,
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

    emit!(SmartDelegateClosed {
        receiver: ctx.accounts.receiver.key(),
        owner: ctx.accounts.owner.key(),
        smart_delegate: ctx.accounts.smart_delegate.key(),
        token_account: ctx.accounts.token_account.key(),
        token_program: ctx.accounts.token_program.key(),
    });

    Ok(())
}

#[event]
pub struct SmartDelegateClosed {
    pub receiver: Pubkey,
    pub owner: Pubkey,
    pub smart_delegate: Pubkey,
    pub token_account: Pubkey,
    pub token_program: Pubkey,
}
