use anchor_lang::prelude::*;

use crate::state::smart_account_nonce::SmartAccountNonce;

#[derive(Accounts)]
pub struct InitSmartAccountNonce<'info> {
    pub authority: Signer<'info>,

    #[account(mut)]
    pub payer: Signer<'info>,

    #[account(
        init,
        space = 8 + SmartAccountNonce::INIT_SPACE,
        seeds = [
            b"smart-account-nonce",
            authority.key().as_ref(),
        ],
        bump,
        payer = payer,
    )]
    pub smart_account_nonce: Account<'info, SmartAccountNonce>,

    pub system_program: Program<'info, System>,
}

pub fn handle(ctx: Context<InitSmartAccountNonce>) -> Result<()> {
    ctx.accounts.smart_account_nonce.nonce = 0;
    ctx.accounts.smart_account_nonce.bump = *ctx
        .bumps
        .get("smart_account_nonce")
        .expect("smart_account_nonce bump");

    Ok(())
}
