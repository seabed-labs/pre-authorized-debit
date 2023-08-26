use anchor_lang::prelude::*;
use anchor_spl::token::{self, ApproveChecked, Mint, Token, TokenAccount};

use crate::state::smart_delegate::SmartDelegate;

#[derive(Accounts)]
pub struct InitSmartDelegate<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,

    pub owner: Signer<'info>,

    pub token_mint: Account<'info, Mint>,

    pub token_account: Account<'info, TokenAccount>,

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

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

pub fn handle_init_smart_delegate(ctx: Context<InitSmartDelegate>) -> Result<()> {
    ctx.accounts.smart_delegate.token_account = ctx.accounts.token_account.key();
    ctx.accounts.smart_delegate.pre_authorization_nonce = 0;
    ctx.accounts.smart_delegate.bump = *ctx
        .bumps
        .get("smart_delegate")
        .expect("smart_delegate PDA bump access failed");

    // ApproveChecked (as opposed to Approve) just makes sure the token account is actually an account for given mint
    // This is idempotent
    token::approve_checked(
        CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            ApproveChecked {
                to: ctx.accounts.token_account.to_account_info(),
                mint: ctx.accounts.token_mint.to_account_info(),
                delegate: ctx.accounts.smart_delegate.to_account_info(),
                authority: ctx.accounts.owner.to_account_info(),
            },
        ),
        u64::MAX,
        ctx.accounts.token_mint.decimals,
    )?;

    // NOTE: The user can revoke this delegation whenever they want by directly send the revoke IX to the SPL token program.
    //       If they do this, our SDK will expose direct IXs to re-connect the smart-delegate with an approve_checked IX.
    //       Re-connecting does not require an IX in this program as it can be done directly with the SPL token program.

    Ok(())
}
