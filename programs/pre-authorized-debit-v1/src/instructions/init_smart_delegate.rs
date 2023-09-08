use anchor_lang::prelude::*;
use anchor_spl::token_interface::{self, Approve, TokenAccount, TokenInterface};

use crate::{errors::CustomProgramError, state::smart_delegate::SmartDelegate};

#[derive(Accounts)]
pub struct InitSmartDelegate<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,

    pub owner: Signer<'info>,

    #[account(
        mut,
        has_one = owner @ CustomProgramError::InitSmartDelegateUnauthorized
    )]
    pub token_account: InterfaceAccount<'info, TokenAccount>,

    #[account(
        init,
        seeds = [
            b"smart-delegate",
            token_account.key().as_ref(),
        ],
        bump,
        space = 8 + SmartDelegate::INIT_SPACE,
        payer = payer,
    )]
    pub smart_delegate: Account<'info, SmartDelegate>,

    pub token_program: Interface<'info, TokenInterface>,
    pub system_program: Program<'info, System>,
}

pub fn handle_init_smart_delegate(ctx: Context<InitSmartDelegate>) -> Result<()> {
    ctx.accounts.smart_delegate.token_account = ctx.accounts.token_account.key();
    ctx.accounts.smart_delegate.bump = *ctx
        .bumps
        .get("smart_delegate")
        .expect("smart_delegate PDA bump access failed");

    // This is idempotent
    token_interface::approve(
        CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            Approve {
                to: ctx.accounts.token_account.to_account_info(),
                delegate: ctx.accounts.smart_delegate.to_account_info(),
                authority: ctx.accounts.owner.to_account_info(),
            },
        ),
        u64::MAX,
    )?;

    emit!(SmartDelegateInitialized {
        payer: ctx.accounts.payer.key(),
        owner: ctx.accounts.owner.key(),
        token_account: ctx.accounts.token_account.key(),
        mint: ctx.accounts.token_account.mint,
        token_program: ctx.accounts.token_program.key(),
        smart_delegate: ctx.accounts.smart_delegate.key(),
    });

    // NOTE: The user can revoke this delegation whenever they want by directly send the revoke IX to the SPL token / token2022 program.
    //       If they do this, our SDK will expose direct IXs to re-connect the smart-delegate with an approve_checked IX.
    //       Re-connecting does not require an IX in this program as it can be done directly with the SPL token / token2022 program.

    Ok(())
}

#[event]
pub struct SmartDelegateInitialized {
    pub payer: Pubkey,
    pub owner: Pubkey,
    pub token_account: Pubkey,
    pub mint: Pubkey,
    pub token_program: Pubkey,
    pub smart_delegate: Pubkey,
}
