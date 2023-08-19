use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct CancelPreAuthorization<'info> {
    pub signer: Signer<'info>,
}
