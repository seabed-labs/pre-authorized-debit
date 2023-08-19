use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct InitSmartAccount<'info> {
    pub signer: Signer<'info>,
}
