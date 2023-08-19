use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct DebitAsAuthority<'info> {
    pub signer: Signer<'info>,
}
