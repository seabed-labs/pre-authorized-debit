use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct InitOneTimePreAuthorization<'info> {
    pub signer: Signer<'info>,
}
