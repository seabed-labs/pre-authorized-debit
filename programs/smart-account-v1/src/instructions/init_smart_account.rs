use anchor_lang::prelude::*;

use crate::state::{smart_account::SmartAccount, smart_account_nonce::SmartAccountNonce};

#[derive(Accounts)]
pub struct InitSmartAccount<'info> {
    pub authority: Signer<'info>,

    #[account(mut)]
    pub payer: Signer<'info>,

    #[account(
        mut,
        seeds = [
            b"smart-account-nonce",
            authority.key().as_ref(),
        ],
        bump = smart_account_nonce.bump,
    )]
    pub smart_account_nonce: Account<'info, SmartAccountNonce>,

    #[account(
        init,
        seeds = [
            b"smart-account",
            authority.key().as_ref(),
            smart_account_nonce.nonce.to_string().as_bytes(),
        ],
        bump,
        space = 8 + SmartAccount::INIT_SPACE,
        payer = payer,
    )]
    pub smart_account: Account<'info, SmartAccount>,

    pub system_program: Program<'info, System>,
}

pub fn handle(ctx: Context<InitSmartAccount>) -> Result<()> {
    ctx.accounts.smart_account_nonce.nonce += 1;

    ctx.accounts.smart_account.authority = ctx.accounts.authority.key();
    ctx.accounts.smart_account.pre_authorization_nonce = 0;
    ctx.accounts.smart_account.bump = *ctx.bumps.get("smart_account").expect("smart_account bump");

    Ok(())
}
