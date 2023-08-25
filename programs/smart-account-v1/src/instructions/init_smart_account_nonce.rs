use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct InitSmartAccountNonce<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,
}
