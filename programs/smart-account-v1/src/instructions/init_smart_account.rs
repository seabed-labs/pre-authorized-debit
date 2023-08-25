use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct InitSmartAccount<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,
}